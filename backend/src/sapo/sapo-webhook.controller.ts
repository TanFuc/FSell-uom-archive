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
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'

@Controller(['sapo/webhook', 'api/sapo/webhook'])
@UseGuards(RedisRateLimiterGuard)
export class SapoWebhookController {
  private readonly logger = new Logger(SapoWebhookController.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 120, ttl: 60 }) // Chống DDoS/Spam webhook
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-sapo-topic') topicHeader?: string,
  ) {
    const topic = topicHeader || payload?.topic || 'fulfillments/create'
    const sapoOrderId = String(payload?.order_id || payload?.id || '')

    // 1. Ghi log toàn bộ payload vào SapoWebhookLog (NO DATA LOSS)
    const log = await this.prisma.sapoWebhookLog.create({
      data: {
        topic,
        sapoOrderId: sapoOrderId || null,
        payload: payload ?? {},
        status: 'received',
      },
    })

    // 2. Chống xử lý trùng lặp (Idempotency) bằng Redis Lock TTL 10 phút
    const idempotencyId = payload?.id || payload?.fulfillment_id || Date.now()
    const idempotencyKey = `sapo:webhook:idempotency:${topic}:${sapoOrderId}:${idempotencyId}`
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
      // 3. Xử lý logic theo sự kiện Webhook từ Sapo
      // A. Sự kiện HỦY ĐƠN: orders/cancelled hoặc payload status = 'cancelled'
      if (
        topic.includes('orders/cancelled') ||
        payload?.status === 'cancelled' ||
        payload?.financial_status === 'voided'
      ) {
        if (sapoOrderId) {
          await this.prisma.order.updateMany({
            where: {
              OR: [{ sapoOrderId }, { sapoOrderNumber: String(payload?.order_number || '') }],
              deletedAt: null,
            },
            data: {
              status: 'cancelled',
              updatedAt: new Date(),
            },
          })
          this.logger.log(`Webhook Sapo: Đã hủy đơn hàng liên kết Sapo ID ${sapoOrderId}`)
        }
      }

      // B. Sự kiện GIAO HÀNG / FULFILLMENT: fulfillments/create hoặc có mã tracking
      const fulfillmentData = payload?.fulfillment || payload
      const effectiveTrackingNumber =
        fulfillmentData?.tracking_number ||
        (Array.isArray(fulfillmentData?.tracking_numbers) ? fulfillmentData.tracking_numbers[0] : null) ||
        payload?.tracking_number ||
        null

      if (
        topic.includes('fulfillments') ||
        effectiveTrackingNumber ||
        fulfillmentData?.status === 'fulfilled' ||
        payload?.fulfillment_status === 'fulfilled'
      ) {
        const trackingCompany =
          fulfillmentData?.tracking_company ||
          fulfillmentData?.carrier ||
          payload?.tracking_company ||
          payload?.carrier ||
          null

        const trackingNumber = effectiveTrackingNumber

        const trackingUrl =
          fulfillmentData?.tracking_url ||
          (Array.isArray(fulfillmentData?.tracking_urls) ? fulfillmentData.tracking_urls[0] : null) ||
          payload?.tracking_url ||
          (trackingNumber && trackingCompany?.toLowerCase().includes('viettel')
            ? `https://viettelpost.vn/tra-cuu-hanh-trinh?tracking=${trackingNumber}`
            : null)

        if (sapoOrderId) {
          await this.prisma.order.updateMany({
            where: {
              OR: [{ sapoOrderId }, { sapoOrderNumber: String(payload?.order_number || '') }],
              deletedAt: null,
            },
            data: {
              status: 'shipped',
              sapoFulfillmentStatus: fulfillmentData?.status || payload?.status || 'fulfilled',
              trackingCompany,
              trackingNumber,
              trackingUrl,
              updatedAt: new Date(),
            },
          })
          this.logger.log(
            `Webhook Sapo: Đã cập nhật giao vận đơn Sapo ID ${sapoOrderId}, mã tracking: ${trackingNumber}`,
          )
        }
      }

      await this.prisma.sapoWebhookLog.update({
        where: { id: log.id },
        data: { status: 'processed' },
      })

      return { success: true }
    } catch (err: any) {
      this.logger.error('Lỗi khi thực thi xử lý Webhook Sapo', err)
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
}
