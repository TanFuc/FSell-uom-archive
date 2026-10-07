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

    // 2. Tính tổng tiền & sinh mã đơn hàng
    const totalVND = cart.items.reduce(
      (sum, item) => sum + item.priceVND * item.quantity,
      0,
    )
    const orderNumber = `UOM-${Date.now().toString().slice(-6)}`

    // 3. Tạo Order & OrderItem
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
          create: cart.items.map((ci) => ({
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

    // 4. SOFT DELETE giỏ hàng sau khi tạo đơn thành công (BẢO TOÀN DỮ LIỆU)
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { deletedAt: new Date() },
    })

    for (const item of cart.items) {
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { deletedAt: new Date() },
      })
    }

    // 5. Đẩy đơn sang Sapo (POST /admin/orders.json)
    try {
      const sapoPayload = {
        order: {
          email: dto.customerEmail,
          financial_status: 'pending',
          fulfillment_status: null,
          inventory_behaviour: 'decrement_obeying_policy',
          send_receipt: false,
          send_webhooks: true,
          note: dto.note || `Đơn hàng từ website: ${orderNumber}`,
          line_items: cart.items.map((item) => ({
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
        await this.prisma.order.update({
          where: { id: newOrder.id },
          data: {
            sapoOrderId: String(sapoOrder.id),
            sapoOrderNumber: String(sapoOrder.order_number || ''),
            sapoFinancialStatus: sapoOrder.financial_status || 'pending',
          },
        })
        this.logger.log(
          `Đơn hàng web #${orderNumber} đã liên kết thành công với Sapo Order ID #${sapoOrder.id}`,
        )
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
      // 1. Gọi GET /admin/orders/{id}/fulfillments.json để lấy thông tin giao vận
      let fulfillments = await this.sapoService.getOrderFulfillments(order.sapoOrderId)

      // 2. Nếu danh sách rỗng, gọi GET /admin/orders/{id}.json để kiểm tra order level
      let sapoOrder: any = null
      if (!fulfillments || fulfillments.length === 0) {
        sapoOrder = await this.sapoService.getOrderDetail(order.sapoOrderId)
        if (sapoOrder?.fulfillments && sapoOrder.fulfillments.length > 0) {
          fulfillments = sapoOrder.fulfillments
        }
      }

      // 3. Nếu tìm thấy fulfillment trên Sapo
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

        const updatedOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status:
              order.status === 'delivered'
                ? 'delivered'
                : sapoFulfillmentStatus === 'cancelled'
                ? 'cancelled'
                : 'shipped',
            sapoFulfillmentStatus,
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

      // 4. Nếu đơn đã bị hủy trên Sapo
      if (sapoOrder?.status === 'cancelled' || sapoOrder?.cancelled_at) {
        const cancelledOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
          include: {
            items: { where: { deletedAt: null } },
          },
        })
        return cancelledOrder
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
   */
  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
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
  }
}
