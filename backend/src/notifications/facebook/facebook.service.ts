import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { PrismaService } from '../../prisma/prisma.service'

interface FacebookNotificationData {
  orderNumber: string
  customerName: string
  totalVND: number
  items: Array<{ name: string; quantity: number }>
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly FB_GRAPH_API = 'https://graph.facebook.com/v18.0'

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async sendOrderNotification(data: FacebookNotificationData): Promise<void> {
    try {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { id: 'singleton' },
      })

      if (!settings?.facebookEnabled || !settings.facebookPageAccessToken) {
        this.logger.warn('Facebook notification disabled or not configured')
        return
      }

      const pageId = this.configService.get<string>('FACEBOOK_PAGE_ID')

      if (!pageId) {
        this.logger.warn('FACEBOOK_PAGE_ID not configured')
        return
      }

      const message = this.formatOrderMessage(data)

      // Note: Sending to page's own conversation (appears in inbox)
      // For actual messaging to users, you'd need the user's PSID (Page-Scoped ID)
      await axios.post(
        `${this.FB_GRAPH_API}/${pageId}/feed`,
        {
          message: message,
          published: false, // Unpublished post (visible only to admins)
        },
        {
          params: {
            access_token: settings.facebookPageAccessToken,
          },
        },
      )

      this.logger.log('Facebook notification sent')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Failed to send Facebook notification',
          error.response?.data || error.message,
        )
      } else {
        this.logger.error('Failed to send Facebook notification', error)
      }
    }
  }

  private formatOrderMessage(data: FacebookNotificationData): string {
    const itemsList = data.items.map((item) => `• ${item.name} x${item.quantity}`).join('\n')

    return `
ĐƠN HÀNG MỚI - ƯƠM ARCHIVE

Mã đơn: ${data.orderNumber}
Khách hàng: ${data.customerName}

Sản phẩm:
${itemsList}

Tổng: ${data.totalVND.toLocaleString('vi-VN')} ₫
    `.trim()
  }
}
