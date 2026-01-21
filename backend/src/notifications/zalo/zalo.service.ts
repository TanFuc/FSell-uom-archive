import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { PrismaService } from '../../prisma/prisma.service'

interface ZaloNotificationData {
  orderNumber: string
  customerName: string
  totalVND: number
  phoneNumber: string
}

@Injectable()
export class ZaloService {
  private readonly logger = new Logger(ZaloService.name)
  private readonly ZALO_ZNS_API = 'https://business.openapi.zalo.me/message/template'

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async sendOrderNotification(data: ZaloNotificationData): Promise<void> {
    try {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { id: 'singleton' },
      })

      if (!settings?.zaloEnabled || !settings.zaloAccessToken) {
        this.logger.warn('Zalo notification disabled or not configured')
        return
      }

      // Send to admin phone
      if (settings.adminPhone) {
        await this.sendZNS(settings.adminPhone, settings.zaloAccessToken, {
          order_number: data.orderNumber,
          customer_name: data.customerName,
          total: data.totalVND.toLocaleString('vi-VN'),
        })
      }

      this.logger.log(`Zalo notification sent to ${settings.adminPhone}`)
    } catch (error) {
      this.logger.error('Failed to send Zalo notification', error)
    }
  }

  private async sendZNS(
    phone: string,
    accessToken: string,
    templateData: Record<string, string>,
  ): Promise<void> {
    try {
      // Get template ID from env
      const templateId = this.configService.get<string>('ZALO_TEMPLATE_ID')

      if (!templateId) {
        this.logger.warn('ZALO_TEMPLATE_ID not configured')
        return
      }

      // Format phone number (convert 0xxx to 84xxx)
      const formattedPhone = phone.startsWith('0') ? phone.replace(/^0/, '84') : phone

      const response = await axios.post(
        this.ZALO_ZNS_API,
        {
          phone: formattedPhone,
          template_id: templateId,
          template_data: templateData,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            access_token: accessToken,
          },
        },
      )

      if (response.data.error !== 0) {
        this.logger.error(`Zalo API error: ${JSON.stringify(response.data)}`)
        throw new Error(`Zalo API error: ${response.data.message}`)
      }

      this.logger.log(`Zalo ZNS sent successfully: ${JSON.stringify(response.data)}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Zalo API error', error.response?.data || error.message)
      } else {
        this.logger.error('Zalo API error', error)
      }
      throw error
    }
  }
}
