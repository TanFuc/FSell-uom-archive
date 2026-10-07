import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SapoService } from '../sapo/sapo.service'
import { RedisService } from '../redis/redis.service'
import { CreateOrderCheckoutDto } from './dto/create-order.dto'
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto'

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sapoService: SapoService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Tạo đơn hàng từ giỏ hàng (Cart to Order), Soft-delete giỏ hàng, và bắn sang Sapo
   */
  async checkout(dto: CreateOrderCheckoutDto, customerId?: string) {
    // 1. Tìm giỏ hàng hiện tại (chưa soft-delete)
    const cart = await this.prisma.cart.findFirst({
      where: {
        id: dto.cartId,
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: { product: true },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống hoặc đã được xử lý')
    }

    // 2. Lọc các sản phẩm được chọn để đặt hàng (nếu khách chọn cụ thể qua checkbox)
    const itemsToOrder =
      dto.itemIds && dto.itemIds.length > 0
        ? cart.items.filter((item) => dto.itemIds!.includes(item.id))
        : cart.items

    if (itemsToOrder.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một sản phẩm để đặt hàng')
    }

    // 3. Tính tổng tiền & sinh mã đơn hàng
    const totalVND = itemsToOrder.reduce(
      (sum, item) => sum + item.priceVND * item.quantity,
      0,
    )
    const orderNumber = `UOM-${Date.now().toString().slice(-6)}`

    // 4. Tạo Order & OrderItem
    const newOrder = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customerId || cart.customerId || null,
        customerEmail: dto.customerEmail.toLowerCase().trim(),
        customerName: dto.customerName.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        shippingAddress: dto.shippingAddress.trim(),
        note: dto.note?.trim() || null,
        totalVND,
        isDraft: false,
        status: 'pending',
        items: {
          create: itemsToOrder.map((ci) => ({
            productId: ci.productId,
            productTitle: ci.product?.nameVi || 'Sản phẩm gốm sứ thủ công',
            productSku: ci.product?.sku || null,
            productImage: Array.isArray(ci.product?.images)
              ? (ci.product?.images[0] as string)
              : null,
            quantity: ci.quantity,
            priceVND: ci.priceVND,
            sapoVariantId: null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // 5. SOFT DELETE các sản phẩm đã được đặt
    for (const item of itemsToOrder) {
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { deletedAt: new Date() },
      })
    }

    // Nếu toàn bộ item trong giỏ đã đặt thì soft-delete giỏ hàng, nếu còn item thì giữ giỏ hàng
    const remainingItems = cart.items.filter(
      (item) => !itemsToOrder.some((ordered) => ordered.id === item.id),
    )
    if (remainingItems.length === 0) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { deletedAt: new Date() },
      })
    }

    // 6. Đẩy đơn sang Sapo (POST /admin/orders.json)
    try {
      const sapoPayload = {
        order: {
          email: dto.customerEmail,
          financial_status: 'pending',
          fulfillment_status: null,
          inventory_behaviour: 'decrement_obeying_policy',
          send_receipt: false,
          send_webhooks: true,
          source_name: 'UOM Website',
          source: 'UOM Website',
          tags: 'UOM Website',
          note: dto.note || `Đơn hàng từ UOM Website: ${orderNumber}`,
          line_items: itemsToOrder.map((item) => ({
            title: item.product?.nameVi || 'Sản phẩm',
            price: item.priceVND,
            quantity: item.quantity,
          })),
          shipping_address: {
            first_name: dto.customerName,
            phone: dto.phoneNumber,
            address1: dto.shippingAddress,
            city: 'Vietnam',
            country_name: 'Vietnam',
          },
        },
      }

      const sapoOrder = await this.sapoService.pushOrderToSapo(sapoPayload)

      if (sapoOrder && sapoOrder.id) {
        const cleanSapoNumber = String(
          sapoOrder.order_number || sapoOrder.name || '',
        )
          .replace('#', '')
          .trim()
        const finalOrderNumber = cleanSapoNumber
          ? `UOM-${cleanSapoNumber}`
          : orderNumber

        await this.prisma.order.update({
          where: { id: newOrder.id },
          data: {
            orderNumber: finalOrderNumber,
            sapoOrderId: String(sapoOrder.id),
            sapoOrderNumber: cleanSapoNumber,
            sapoFinancialStatus: sapoOrder.financial_status || 'pending',
          },
        })
        this.logger.log(
          `Đơn hàng web #${finalOrderNumber} đã liên kết thành công với Sapo Order ID #${sapoOrder.id} (#${cleanSapoNumber})`,
        )
        return this.getOrderByIdOrNumber(finalOrderNumber)
      }
    } catch (sapoError: any) {
      this.logger.error(
        `Đơn hàng #${orderNumber} tạo thành công nhưng đẩy sang Sapo thất bại: ${sapoError.message}`,
      )
      // Không throw error để khách vẫn hoàn tất đơn trên web, Sapo có thể retry
    }

    return this.getOrderByIdOrNumber(newOrder.id)
  }

  /**
   * Lấy chi tiết đơn hàng theo ID hoặc OrderNumber để Tracking.
   * CƠ CHẾ DỰ PHÒNG (FALLBACK): Khi Webhook gặp vấn đề (mất mạng, server Sapo lag, chưa bắn tới),
   * hệ thống sẽ tự động gọi Sapo API để kéo tracking number và cập nhật DB.
   */
  async getOrderByIdOrNumber(identifier: string) {
    let order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
        },
      },
    })

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng')
    }

    // Nếu đơn có liên kết Sapo nhưng chưa có mã vận đơn (trackingNumber) và chưa hoàn tất / chưa hủy
    if (
      order.sapoOrderId &&
      !order.trackingNumber &&
      order.status !== 'cancelled' &&
      order.status !== 'delivered'
    ) {
      const throttleKey = `sapo:order:sync_throttle:${order.id}`
      const isThrottled = await this.redisService.exists(throttleKey)

      if (!isThrottled) {
        // Khóa throttle 30s để tránh spam Sapo khi khách F5 liên tục
        await this.redisService.setWithTtl(throttleKey, '1', 30)
        try {
          const syncedOrder = await this.syncOrderFulfillmentFromSapo(order.id)
          if (syncedOrder) {
            order = syncedOrder
          }
        } catch (syncErr: any) {
          this.logger.warn(
            `Fallback sync tracking thất bại cho đơn ${order.orderNumber}: ${syncErr.message}`,
          )
        }
      }
    }

    return order
  }

  /**
   * Chủ động đồng bộ trạng thái Fulfillment và Tracking Number từ Sapo.
   * Giải quyết triệt để trường hợp Webhook gặp sự cố không gửi được dữ liệu.
   */
  async syncOrderFulfillmentFromSapo(identifier: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
        },
      },
    })

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng')
    }

    if (!order.sapoOrderId) {
      this.logger.warn(
        `Đơn hàng #${order.orderNumber} chưa liên kết SapoOrderId, không thể đồng bộ từ Sapo`,
      )
      return order
    }

    try {
      // 1. Gọi trực tiếp GET /admin/orders/{id}.json để lấy toàn cảnh trạng thái đơn hàng từ Sapo
      const sapoOrder = await this.sapoService.getOrderDetail(order.sapoOrderId)

      if (!sapoOrder) {
        this.logger.warn(`Không tìm thấy đơn hàng Sapo ID #${order.sapoOrderId}`)
        return order
      }

      // 2. Kiểm tra nếu đơn hàng đã bị hủy trên Sapo:
      // Sapo biểu thị đơn hủy bằng status: 'closed' kèm cancel_reason (ví dụ: 'customer'),
      // hoặc status: 'cancelled', cancelled_at, hoặc refunds toàn bộ.
      const isCancelled = Boolean(
        sapoOrder.status === 'cancelled' ||
        sapoOrder.status === 'closed' ||
        sapoOrder.cancel_reason ||
        sapoOrder.cancelled_at ||
        sapoOrder.financial_status === 'voided' ||
        (Array.isArray(sapoOrder.refunds) && sapoOrder.refunds.length > 0 && Number(sapoOrder.current_total_price || 0) === 0),
      )

      if (isCancelled) {
        const cancelledOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'cancelled',
            sapoFinancialStatus: sapoOrder.financial_status === 'paid' ? 'refunded' : 'voided',
            updatedAt: new Date(),
          },
          include: {
            items: { where: { deletedAt: null } },
          },
        })
        this.logger.log(`Đã đồng bộ trạng thái HỦY từ Sapo cho đơn #${order.orderNumber}`)
        return cancelledOrder
      }

      // 3. Trích xuất thông tin giao vận (Fulfillments)
      let fulfillments = sapoOrder.fulfillments || []
      if (!fulfillments || fulfillments.length === 0) {
        fulfillments = await this.sapoService.getOrderFulfillments(order.sapoOrderId)
      }

      if (fulfillments && fulfillments.length > 0) {
        const latestFulfillment =
          fulfillments.find((f: any) => Boolean(f.tracking_number)) ||
          fulfillments[fulfillments.length - 1]

        const trackingNumber =
          latestFulfillment?.tracking_number ||
          (Array.isArray(latestFulfillment?.tracking_numbers)
            ? latestFulfillment.tracking_numbers[0]
            : null) ||
          order.trackingNumber

        const trackingCompany =
          latestFulfillment?.tracking_company ||
          latestFulfillment?.carrier ||
          order.trackingCompany

        const trackingUrl =
          latestFulfillment?.tracking_url ||
          (Array.isArray(latestFulfillment?.tracking_urls)
            ? latestFulfillment.tracking_urls[0]
            : null) ||
          (trackingNumber && trackingCompany?.toLowerCase().includes('viettel')
            ? `https://viettelpost.vn/tra-cuu-hanh-trinh?tracking=${trackingNumber}`
            : order.trackingUrl)

        const sapoFulfillmentStatus = latestFulfillment?.status || 'fulfilled'

        // Đơn hàng CHỈ thực sự chuyển sang 'shipped' (Đang vận chuyển) khi:
        // Đã có mã vận đơn (tracking_number) HOẶC đã có mốc bàn giao thực tế (handed_over_at).
        // Nếu mới chỉ tạo phiếu đóng gói nội bộ (FUN...) nhưng chưa bàn giao bưu cục thì trạng thái chính xác là 'processing' (Đang đóng gói).
        const isActuallyShipped = Boolean(
          trackingNumber ||
          latestFulfillment?.handed_over_at ||
          (latestFulfillment?.shipment_status && latestFulfillment?.shipment_status !== 'ready_to_pick')
        )

        const targetStatus =
          order.status === 'delivered'
            ? 'delivered'
            : sapoFulfillmentStatus === 'cancelled'
            ? 'cancelled'
            : isActuallyShipped
            ? 'shipped'
            : 'processing'

        const updatedOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus,
            sapoFulfillmentStatus,
            sapoFinancialStatus: sapoOrder.financial_status || order.sapoFinancialStatus,
            trackingNumber: trackingNumber || null,
            trackingCompany: trackingCompany || null,
            trackingUrl: trackingUrl || null,
            updatedAt: new Date(),
          },
          include: {
            items: { where: { deletedAt: null } },
          },
        })

        this.logger.log(
          `Đã đồng bộ thành công tracking từ Sapo cho đơn #${order.orderNumber}: tracking=${trackingNumber}, status=${updatedOrder.status}`,
        )
        return updatedOrder
      }

      // 4. Nếu đơn chưa có fulfillments nhưng có cập nhật financial_status từ Sapo
      if (sapoOrder.financial_status && sapoOrder.financial_status !== order.sapoFinancialStatus) {
        const updatedFinancial = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            sapoFinancialStatus: sapoOrder.financial_status,
            status:
              sapoOrder.financial_status === 'paid' && order.status === 'pending'
                ? 'processing'
                : order.status,
            updatedAt: new Date(),
          },
          include: {
            items: { where: { deletedAt: null } },
          },
        })
        return updatedFinancial
      }
    } catch (err: any) {
      this.logger.error(
        `Lỗi khi đồng bộ fulfillment từ Sapo cho đơn #${order.orderNumber}: ${err.message}`,
      )
    }

    return order
  }

  /**
   * Tạo Fulfillment trực tiếp trên Sapo:
   * POST /admin/orders/{id}/fulfillments.json
   * Dành cho trường hợp người bán hoặc hệ thống chủ động đẩy giao vận sang Sapo
   * và nhận về mã tracking number ngay lập tức.
   */
  async createFulfillment(identifier: string, dto: CreateFulfillmentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
        deletedAt: null,
      },
      include: {
        items: { where: { deletedAt: null } },
      },
    })

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng')
    }

    if (!order.sapoOrderId) {
      throw new BadRequestException('Đơn hàng này chưa được đồng bộ hoặc chưa có Sapo Order ID')
    }

    const sapoFulfillment = await this.sapoService.createFulfillment(order.sapoOrderId, {
      tracking_number: dto.trackingNumber || `TRACK-${Date.now().toString().slice(-8)}`,
      tracking_company: dto.trackingCompany || 'Chuyển phát nhanh',
      tracking_url: dto.trackingUrl,
      send_notification_email: dto.sendNotificationEmail ?? true,
    })

    const trackingNumber =
      sapoFulfillment?.tracking_number ||
      (Array.isArray(sapoFulfillment?.tracking_numbers)
        ? sapoFulfillment.tracking_numbers[0]
        : null) ||
      dto.trackingNumber ||
      order.trackingNumber

    const trackingCompany =
      sapoFulfillment?.tracking_company ||
      sapoFulfillment?.carrier ||
      dto.trackingCompany ||
      order.trackingCompany

    const trackingUrl =
      sapoFulfillment?.tracking_url ||
      (Array.isArray(sapoFulfillment?.tracking_urls)
        ? sapoFulfillment.tracking_urls[0]
        : null) ||
      dto.trackingUrl ||
      order.trackingUrl

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'shipped',
        sapoFulfillmentStatus: sapoFulfillment?.status || 'fulfilled',
        trackingNumber: trackingNumber || null,
        trackingCompany: trackingCompany || null,
        trackingUrl: trackingUrl || null,
        updatedAt: new Date(),
      },
      include: {
        items: { where: { deletedAt: null } },
      },
    })

    this.logger.log(
      `Đã tạo fulfillment thành công trên Sapo cho đơn #${order.orderNumber}, tracking: ${trackingNumber}`,
    )

    return updatedOrder
  }

  /**
   * Lấy danh sách đơn hàng của một Customer đã đăng nhập
   * Tự động đồng bộ trạng thái mới nhất từ Sapo (Hủy, Giao vận, Thanh toán) cho các đơn chưa hoàn thành
   */
  async getCustomerOrders(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        customerId,
        deletedAt: null,
        isDraft: false,
      },
      include: {
        items: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Đồng bộ tức thì các đơn chưa kết thúc từ Sapo
    const syncedOrders = await Promise.all(
      orders.map(async (order) => {
        if (
          order.sapoOrderId &&
          order.status !== 'cancelled' &&
          order.status !== 'delivered'
        ) {
          try {
            const synced = await this.syncOrderFulfillmentFromSapo(order.id)
            return synced || order
          } catch {
            return order
          }
        }
        return order
      }),
    )

    return syncedOrders
  }
}
