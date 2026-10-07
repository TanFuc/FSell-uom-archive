import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { SapoSyncService } from './sapo-sync.service'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'

@Controller(['sapo/webhook', 'api/sapo/webhook'])
@UseGuards(RedisRateLimiterGuard)
export class SapoWebhookController {
  private readonly logger = new Logger(SapoWebhookController.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly syncService: SapoSyncService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 120, ttl: 60 }) // Chống DDoS/Spam webhook
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-sapo-topic') topicHeader?: string,
    @Headers('x-sapo-hmac-sha256') _hmacHeader?: string,
  ) {
    // 1. Xác định topic và resource ID
    const topic = (topicHeader || payload?.topic || 'unknown').toLowerCase().trim()
    const resourceData =
      payload?.order ||
      payload?.fulfillment ||
      payload?.product ||
      payload?.collection ||
      payload?.customer ||
      payload?.refund ||
      payload?.transaction ||
      payload

    const sapoOrderId = String(
      resourceData?.order_id ||
      payload?.order_id ||
      (topic.startsWith('orders/') ? resourceData?.id || payload?.id : '') ||
      '',
    )

    // 2. Ghi log toàn bộ payload vào SapoWebhookLog (Đảm bảo tuyệt đối không mất dữ liệu)
    const log = await this.prisma.sapoWebhookLog.create({
      data: {
        topic,
        sapoOrderId: sapoOrderId || null,
        payload: payload ?? {},
        status: 'received',
      },
    })

    // 3. Chống xử lý trùng lặp (Idempotency) bằng Redis Lock TTL 10 phút
    const resourceId = resourceData?.id || payload?.id || Date.now()
    const idempotencyKey = `sapo:webhook:idempotency:${topic}:${sapoOrderId || resourceId}:${resourceId}`
    const alreadyProcessed = await this.redisService.exists(idempotencyKey)

    if (alreadyProcessed) {
      this.logger.warn(`Bỏ qua webhook Sapo trùng lặp: ${idempotencyKey}`)
      await this.prisma.sapoWebhookLog.update({
        where: { id: log.id },
        data: { status: 'ignored_duplicate' },
      })
      return { status: 'ignored_duplicate' }
    }

    await this.redisService.setWithTtl(idempotencyKey, 'PROCESSED', 600)

    try {
      this.logger.log(`Bắt đầu xử lý Webhook Sapo: topic=[${topic}], resourceId=${resourceId}`)

      // 4. Phân phối xử lý theo Topic Event chuẩn của Sapo
      if (topic.startsWith('orders/')) {
        await this.handleOrderEvent(topic, resourceData, sapoOrderId)
      } else if (topic.startsWith('fulfillments/')) {
        await this.handleFulfillmentEvent(topic, resourceData)
      } else if (topic.startsWith('products/')) {
        await this.handleProductEvent(topic, resourceData)
      } else if (topic.startsWith('collections/')) {
        await this.handleCollectionEvent(topic, resourceData)
      } else if (topic.startsWith('customers/')) {
        await this.handleCustomerEvent(topic, resourceData)
      } else if (topic === 'order_transactions/create') {
        await this.handleOrderTransactionEvent(resourceData)
      } else if (topic === 'refunds/create') {
        await this.handleRefundEvent(resourceData)
      } else if (
        topic === 'store/update' ||
        topic.startsWith('app/') ||
        topic.startsWith('carts/') ||
        topic === 'customer_groups/delete'
      ) {
        this.logger.log(`Ghi nhận sự kiện hệ thống Sapo [${topic}] thành công`)
      } else {
        this.logger.warn(`Webhook nhận được topic chưa định nghĩa cụ thể: ${topic}`)
      }

      await this.prisma.sapoWebhookLog.update({
        where: { id: log.id },
        data: { status: 'processed' },
      })

      return { success: true, topic }
    } catch (err: any) {
      this.logger.error(`Lỗi khi thực thi xử lý Webhook Sapo [${topic}]`, err)
      await this.prisma.sapoWebhookLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          errorMessage: err.message || 'Lỗi không xác định',
        },
      })
      return { success: false, error: err.message }
    }
  }

  // ==============================================================================
  // A. ORDERS EVENT HANDLERS
  // ==============================================================================
  private async handleOrderEvent(topic: string, orderData: any, sapoOrderId: string) {
    const orderNumber = String(orderData?.order_number || orderData?.number || '')
    const financialStatus = orderData?.financial_status
    const fulfillmentStatus = orderData?.fulfillment_status
    const orderStatus = orderData?.status

    // Tìm đơn hàng trong DB
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        OR: [
          sapoOrderId ? { sapoOrderId } : undefined,
          orderNumber ? { sapoOrderNumber: orderNumber } : undefined,
          orderNumber ? { orderNumber } : undefined,
        ].filter(Boolean) as any,
        deletedAt: null,
      },
      include: { items: true },
    })

    // 1. Trường hợp XÓA ĐƠN HÀNG: orders/delete (Soft delete - Không bao giờ hard delete)
    if (topic === 'orders/delete') {
      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đã soft delete đơn hàng ${existingOrder.orderNumber}`)
      }
      return
    }

    // 2. Trường hợp HỦY ĐƠN HÀNG: orders/cancelled
    const isCancelled =
      topic === 'orders/cancelled' ||
      orderStatus === 'cancelled' ||
      orderStatus === 'closed' ||
      Boolean(orderData?.cancel_reason) ||
      Boolean(orderData?.cancelled_at) ||
      financialStatus === 'voided' ||
      (Array.isArray(orderData?.refunds) && orderData.refunds.length > 0 && Number(orderData?.current_total_price || 0) === 0)

    if (isCancelled) {
      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: 'cancelled',
            sapoFinancialStatus: financialStatus === 'paid' ? 'refunded' : (financialStatus || 'voided'),
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đã hủy đơn hàng ${existingOrder.orderNumber}`)
      }
      return
    }

    // 3. Trường hợp ĐÃ THANH TOÁN: orders/paid
    if (topic === 'orders/paid') {
      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            sapoFinancialStatus: 'paid',
            status: existingOrder.status === 'pending' ? 'processing' : existingOrder.status,
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đơn hàng ${existingOrder.orderNumber} đã thanh toán (paid)`)
      }
      return
    }

    // 4. Trường hợp GIAO HÀNG THÀNH CÔNG: orders/fulfilled
    if (topic === 'orders/fulfilled') {
      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: 'shipped',
            sapoFulfillmentStatus: 'fulfilled',
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đơn hàng ${existingOrder.orderNumber} đã giao vận đầy đủ (fulfilled)`)
      }
      return
    }

    // 5. Trường hợp GIAO HÀNG MỘT PHẦN: orders/partially_fulfilled
    if (topic === 'orders/partially_fulfilled') {
      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            sapoFulfillmentStatus: 'partially_fulfilled',
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đơn hàng ${existingOrder.orderNumber} giao hàng 1 phần (partially_fulfilled)`)
      }
      return
    }

    // 6. Trường hợp TẠO MỚI / CẬP NHẬT ĐƠN HÀNG: orders/create hoặc orders/updated
    // Trích xuất thông tin tracking nếu có kèm theo trong mảng fulfillments
    let trackingNumber = existingOrder?.trackingNumber || null
    let trackingCompany = existingOrder?.trackingCompany || null
    let trackingUrl = existingOrder?.trackingUrl || null

    if (Array.isArray(orderData?.fulfillments) && orderData.fulfillments.length > 0) {
      const ful = orderData.fulfillments[0]
      trackingNumber =
        ful.tracking_number ||
        (Array.isArray(ful.tracking_numbers) ? ful.tracking_numbers[0] : null) ||
        trackingNumber
      trackingCompany = ful.tracking_company || ful.carrier || trackingCompany
      trackingUrl =
        ful.tracking_url ||
        (Array.isArray(ful.tracking_urls) ? ful.tracking_urls[0] : null) ||
        trackingUrl
    }

    let calculatedStatus = existingOrder?.status || 'pending'
    if (fulfillmentStatus === 'fulfilled') {
      calculatedStatus = 'shipped'
    } else if (financialStatus === 'paid' && calculatedStatus === 'pending') {
      calculatedStatus = 'processing'
    }

    if (existingOrder) {
      // CẬP NHẬT ĐƠN HIỆN CÓ
      await this.prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          sapoOrderId: sapoOrderId || existingOrder.sapoOrderId,
          sapoOrderNumber: orderNumber || existingOrder.sapoOrderNumber,
          sapoFinancialStatus: financialStatus || existingOrder.sapoFinancialStatus,
          sapoFulfillmentStatus: fulfillmentStatus || existingOrder.sapoFulfillmentStatus,
          status: calculatedStatus,
          trackingNumber,
          trackingCompany,
          trackingUrl,
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Cập nhật thành công đơn hàng ${existingOrder.orderNumber}`)
    } else if (topic === 'orders/create') {
      // ĐƠN MỚI TẠO TỪ SAPO (POS / Admin) -> LƯU VÀO DB ĐỂ ĐỒNG BỘ HAI CHIỀU
      const customerEmail =
        orderData?.email ||
        orderData?.customer?.email ||
        `customer-${sapoOrderId || Date.now()}@sapo.vn`
      const customerName =
        orderData?.shipping_address?.name ||
        [orderData?.customer?.first_name, orderData?.customer?.last_name].filter(Boolean).join(' ') ||
        orderData?.customer?.name ||
        'Khách hàng Sapo'
      const phoneNumber =
        orderData?.shipping_address?.phone ||
        orderData?.customer?.phone ||
        '0000000000'
      const shippingAddress =
        [
          orderData?.shipping_address?.address1,
          orderData?.shipping_address?.ward,
          orderData?.shipping_address?.district,
          orderData?.shipping_address?.city,
        ]
          .filter(Boolean)
          .join(', ') || 'Địa chỉ ghi nhận từ hệ thống Sapo'

      const totalVND = Math.round(Number(orderData?.total_price || 0))
      const autoOrderNumber = `SAPO-${orderNumber || sapoOrderId || Date.now()}`

      // Tìm customer có sẵn để liên kết
      const customer = await this.prisma.customer.findUnique({
        where: { email: customerEmail },
      })

      const newOrder = await this.prisma.order.create({
        data: {
          orderNumber: autoOrderNumber,
          customerId: customer?.id || null,
          customerEmail,
          customerName,
          shippingAddress,
          phoneNumber,
          note: orderData?.note || null,
          totalVND,
          status: calculatedStatus,
          sapoOrderId: sapoOrderId || null,
          sapoOrderNumber: orderNumber || null,
          sapoFinancialStatus: financialStatus || 'pending',
          sapoFulfillmentStatus: fulfillmentStatus || null,
          trackingNumber,
          trackingCompany,
          trackingUrl,
        },
      })

      // Lưu chi tiết sản phẩm nếu có
      if (Array.isArray(orderData?.line_items) && orderData.line_items.length > 0) {
        for (const item of orderData.line_items) {
          await this.prisma.orderItem.create({
            data: {
              orderId: newOrder.id,
              productTitle: item.title || item.name || 'Sản phẩm Sapo',
              productSku: item.sku || null,
              quantity: Number(item.quantity || 1),
              priceVND: Math.round(Number(item.price || 0)),
              sapoVariantId: String(item.variant_id || ''),
            },
          })
        }
      }

      this.logger.log(`Webhook Sapo: Đã ghi nhận đơn hàng mới từ Sapo #${autoOrderNumber}`)
    }
  }

  // ==============================================================================
  // B. FULFILLMENT EVENT HANDLERS
  // ==============================================================================
  private async handleFulfillmentEvent(topic: string, fulfillmentData: any) {
    const sapoOrderId = String(fulfillmentData?.order_id || '')
    const effectiveTrackingNumber =
      fulfillmentData?.tracking_number ||
      (Array.isArray(fulfillmentData?.tracking_numbers) ? fulfillmentData.tracking_numbers[0] : null) ||
      null

    const trackingCompany =
      fulfillmentData?.tracking_company ||
      fulfillmentData?.carrier ||
      'Chuyển phát tiêu chuẩn'

    let trackingUrl =
      fulfillmentData?.tracking_url ||
      (Array.isArray(fulfillmentData?.tracking_urls) ? fulfillmentData.tracking_urls[0] : null)

    // Tự động xây dựng URL tra cứu nếu là các hãng vận chuyển quen thuộc tại VN
    if (!trackingUrl && effectiveTrackingNumber) {
      const co = trackingCompany.toLowerCase()
      if (co.includes('viettel')) {
        trackingUrl = `https://viettelpost.vn/tra-cuu-hanh-trinh?tracking=${effectiveTrackingNumber}`
      } else if (co.includes('giaohangtietkiem') || co.includes('ghtk')) {
        trackingUrl = `https://i.ghtk.vn/${effectiveTrackingNumber}`
      } else if (co.includes('ghn') || co.includes('giaohangnhanh')) {
        trackingUrl = `https://donhang.ghn.vn/?order_code=${effectiveTrackingNumber}`
      } else if (co.includes('vnpost')) {
        trackingUrl = `http://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${effectiveTrackingNumber}`
      }
    }

    if (sapoOrderId) {
      await this.prisma.order.updateMany({
        where: {
          sapoOrderId,
          deletedAt: null,
        },
        data: {
          status: 'shipped',
          sapoFulfillmentStatus: fulfillmentData?.status || 'fulfilled',
          trackingCompany,
          trackingNumber: effectiveTrackingNumber,
          trackingUrl,
          updatedAt: new Date(),
        },
      })
      this.logger.log(
        `Webhook Sapo [${topic}]: Đã cập nhật giao vận cho đơn hàng Sapo #${sapoOrderId}, mã vận đơn: ${effectiveTrackingNumber}`,
      )
    }
  }

  // ==============================================================================
  // C. PRODUCTS EVENT HANDLERS
  // ==============================================================================
  private async handleProductEvent(topic: string, productData: any) {
    const sapoProductId = String(productData?.id || '')
    if (!sapoProductId) return

    // 1. XÓA SẢN PHẨM: products/delete (Soft delete)
    if (topic === 'products/delete') {
      const sku = productData?.variants?.[0]?.sku ? String(productData.variants[0].sku).trim() : null
      await this.prisma.product.updateMany({
        where: {
          OR: [
            { sapoProductId },
            sku ? { sku } : undefined,
          ].filter(Boolean) as any,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Đã soft delete sản phẩm Sapo ID ${sapoProductId}`)
      return
    }

    // 2. TẠO MỚI HOẶC CẬP NHẬT SẢN PHẨM: products/create, products/update
    try {
      // Ưu tiên gọi cơ chế sync đầy đủ (tải ảnh, mapping biến thể và kho hàng)
      await this.syncService.syncSingleProduct(sapoProductId)
      this.logger.log(`Webhook Sapo: Đã đồng bộ chi tiết sản phẩm Sapo ID ${sapoProductId}`)
    } catch (syncErr: any) {
      this.logger.warn(
        `Đồng bộ qua API Sapo thất bại (${syncErr.message}), tiến hành upsert trực tiếp từ payload webhook`,
      )
      // Fallback: Cập nhật trực tiếp từ payload dữ liệu webhook cung cấp
      const firstVariant = productData.variants?.[0] || {}
      const sku = firstVariant.sku ? String(firstVariant.sku).trim() : `SAPO-${sapoProductId}`
      const priceVND = Math.round(Number(firstVariant.price || 0))
      const stock = Number(firstVariant.inventory_quantity || 0)
      const name = productData.name || 'Sản phẩm Sapo'
      const description = productData.content || ''

      const existing = await this.prisma.product.findFirst({
        where: {
          OR: [{ sapoProductId }, { sku }],
          deletedAt: null,
        },
      })

      if (existing) {
        await this.prisma.product.update({
          where: { id: existing.id },
          data: {
            nameVi: name,
            sku,
            priceVND,
            stock,
            updatedAt: new Date(),
          },
        })
      } else {
        const slug = productData.alias
          ? `${productData.alias}-${Date.now().toString().slice(-4)}`
          : `sp-${sapoProductId}-${Date.now().toString().slice(-4)}`

        await this.prisma.product.create({
          data: {
            slug,
            nameVi: name,
            nameEn: name,
            descriptionVi: description,
            descriptionEn: description,
            sku,
            sapoProductId,
            priceVND,
            stock,
            images: [],
            isActive: true,
          },
        })
      }
    }
  }

  // ==============================================================================
  // D. COLLECTIONS EVENT HANDLERS (DANH MỤC SẢN PHẨM)
  // ==============================================================================
  private async handleCollectionEvent(topic: string, collectionData: any) {
    const title = collectionData?.title || collectionData?.name
    const alias = collectionData?.alias || collectionData?.handle
    const collectionId = String(collectionData?.id || '')
    const image = collectionData?.image?.src || collectionData?.image || null

    if (topic === 'collections/delete') {
      await this.prisma.category.updateMany({
        where: {
          OR: [
            alias ? { slug: alias } : undefined,
            title ? { nameVi: title } : undefined,
          ].filter(Boolean) as any,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Đã soft delete danh mục [${title || alias}]`)
      return
    }

    // collections/create hoặc collections/update
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [
          alias ? { slug: alias } : undefined,
          title ? { nameVi: title } : undefined,
        ].filter(Boolean) as any,
        deletedAt: null,
      },
    })

    if (existing) {
      await this.prisma.category.update({
        where: { id: existing.id },
        data: {
          nameVi: title || existing.nameVi,
          nameEn: title || existing.nameEn,
          image: image || existing.image,
          descriptionVi: collectionData?.description || existing.descriptionVi,
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Đã cập nhật danh mục [${existing.nameVi}]`)
    } else if (title) {
      await this.prisma.category.create({
        data: {
          slug: alias || `col-${collectionId || Date.now()}`,
          nameVi: title,
          nameEn: title,
          descriptionVi: collectionData?.description || '',
          descriptionEn: collectionData?.description || '',
          image: typeof image === 'string' ? image : null,
          isActive: true,
        },
      })
      this.logger.log(`Webhook Sapo: Đã tạo mới danh mục [${title}]`)
    }
  }

  // ==============================================================================
  // E. CUSTOMERS EVENT HANDLERS
  // ==============================================================================
  private async handleCustomerEvent(topic: string, customerData: any) {
    const email = customerData?.email?.toLowerCase()?.trim()
    const phone = customerData?.phone || customerData?.default_address?.phone || null
    const fullName =
      [customerData?.first_name, customerData?.last_name].filter(Boolean).join(' ') ||
      customerData?.name ||
      'Khách hàng Sapo'
    const address = customerData?.default_address
      ? [
          customerData.default_address.address1,
          customerData.default_address.ward,
          customerData.default_address.district,
          customerData.default_address.city,
        ]
          .filter(Boolean)
          .join(', ')
      : null

    // 1. Soft Delete Customer
    if (topic === 'customers/delete') {
      if (email || phone) {
        await this.prisma.customer.updateMany({
          where: {
            OR: [
              email ? { email } : undefined,
              phone ? { phone } : undefined,
            ].filter(Boolean) as any,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            isActive: false,
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đã soft delete khách hàng email=${email}, phone=${phone}`)
      }
      return
    }

    // 2. Enable / Disable Customer
    if (topic === 'customers/enable' || topic === 'customers/disable') {
      const isActive = topic === 'customers/enable'
      if (email || phone) {
        await this.prisma.customer.updateMany({
          where: {
            OR: [
              email ? { email } : undefined,
              phone ? { phone } : undefined,
            ].filter(Boolean) as any,
            deletedAt: null,
          },
          data: {
            isActive,
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Đã cập nhật isActive=${isActive} cho khách hàng ${email || phone}`)
      }
      return
    }

    // 3. Create / Update Customer
    if (email) {
      const existing = await this.prisma.customer.findUnique({
        where: { email },
      })

      if (existing) {
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            fullName: fullName || existing.fullName,
            phone: phone || existing.phone,
            address: address || existing.address,
            isActive: customerData?.state !== 'disabled',
            updatedAt: new Date(),
          },
        })
        this.logger.log(`Webhook Sapo: Cập nhật thông tin khách hàng ${email}`)
      } else {
        const tempPasswordHash = await bcrypt.hash(Math.random().toString(36), 10)
        await this.prisma.customer.create({
          data: {
            email,
            passwordHash: tempPasswordHash,
            fullName,
            phone,
            address,
            isActive: customerData?.state !== 'disabled',
          },
        })
        this.logger.log(`Webhook Sapo: Đã tạo mới hồ sơ khách hàng ${email}`)
      }
    }
  }

  // ==============================================================================
  // F. ORDER TRANSACTIONS EVENT HANDLERS
  // ==============================================================================
  private async handleOrderTransactionEvent(transactionData: any) {
    const sapoOrderId = String(transactionData?.order_id || '')
    const status = transactionData?.status

    if (sapoOrderId && status === 'success') {
      await this.prisma.order.updateMany({
        where: {
          sapoOrderId,
          deletedAt: null,
        },
        data: {
          sapoFinancialStatus: 'paid',
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Giao dịch thành công, cập nhật paid cho đơn hàng Sapo #${sapoOrderId}`)
    }
  }

  // ==============================================================================
  // G. REFUND EVENT HANDLERS
  // ==============================================================================
  private async handleRefundEvent(refundData: any) {
    const sapoOrderId = String(refundData?.order_id || '')
    if (sapoOrderId) {
      await this.prisma.order.updateMany({
        where: {
          sapoOrderId,
          deletedAt: null,
        },
        data: {
          sapoFinancialStatus: 'refunded',
          updatedAt: new Date(),
        },
      })
      this.logger.log(`Webhook Sapo: Đã ghi nhận hoàn tiền (refunded) cho đơn hàng Sapo #${sapoOrderId}`)
    }
  }
}
