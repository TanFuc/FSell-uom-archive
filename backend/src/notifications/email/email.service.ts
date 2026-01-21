import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import { PrismaService } from '../../prisma/prisma.service'

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalVND: number
  shippingAddress: string
  phoneNumber: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(private prisma: PrismaService) {}

  private async getTransporter() {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { id: 'singleton' },
    })

    if (!settings || !settings.emailEnabled) {
      throw new Error('Email notification is disabled')
    }

    if (!settings.smtpUser || !settings.smtpPassword) {
      throw new Error('SMTP credentials not configured')
    }

    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    })
  }

  async sendOrderNotificationToAdmin(data: OrderEmailData): Promise<void> {
    try {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { id: 'singleton' },
      })

      if (!settings?.emailEnabled) {
        this.logger.warn('Email notification disabled')
        return
      }

      const transporter = await this.getTransporter()

      const itemsList = data.items
        .map((item) => `- ${item.name} x${item.quantity}: ${item.price.toLocaleString('vi-VN')} ₫`)
        .join('\n')

      const mailOptions = {
        from: settings.smtpUser,
        to: settings.adminEmail,
        subject: `Đơn hàng mới #${data.orderNumber} - Ươm Archive`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4A4238;">Đơn hàng mới từ Ươm Archive</h2>

            <div style="background: #F9F7F1; padding: 20px; border-radius: 8px;">
              <p><strong>Mã đơn hàng:</strong> ${data.orderNumber}</p>
              <p><strong>Khách hàng:</strong> ${data.customerName}</p>
              <p><strong>Email:</strong> ${data.customerEmail}</p>
              <p><strong>Số điện thoại:</strong> ${data.phoneNumber}</p>
              <p><strong>Địa chỉ:</strong> ${data.shippingAddress}</p>
            </div>

            <h3 style="color: #4A4238; margin-top: 20px;">Chi tiết đơn hàng:</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${itemsList}</pre>

            <p style="font-size: 18px; color: #4A4238;">
              <strong>Tổng cộng:</strong> ${data.totalVND.toLocaleString('vi-VN')} ₫
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #888; font-size: 12px;">
              Email này được gửi tự động từ hệ thống Ươm Archive
            </p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      this.logger.log(`Order notification email sent to ${settings.adminEmail}`)
    } catch (error) {
      this.logger.error('Failed to send email notification', error)
      throw error
    }
  }

  async sendOrderConfirmationToCustomer(data: OrderEmailData): Promise<void> {
    try {
      const settings = await this.prisma.notificationSettings.findUnique({
        where: { id: 'singleton' },
      })

      if (!settings?.emailEnabled) {
        this.logger.warn('Email notification disabled')
        return
      }

      const transporter = await this.getTransporter()

      const itemsList = data.items
        .map((item) => `- ${item.name} x${item.quantity}: ${item.price.toLocaleString('vi-VN')} ₫`)
        .join('\n')

      const mailOptions = {
        from: settings.smtpUser,
        to: data.customerEmail,
        subject: `Xác nhận đơn hàng #${data.orderNumber} - Ươm Archive`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4A4238;">Cảm ơn bạn đã đặt hàng!</h2>

            <p>Xin chào <strong>${data.customerName}</strong>,</p>
            <p>Đơn hàng của bạn đã được tiếp nhận.</p>

            <div style="background: #F9F7F1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Mã đơn hàng:</strong> ${data.orderNumber}</p>
            </div>

            <h3 style="color: #4A4238;">Chi tiết đơn hàng:</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${itemsList}</pre>

            <p style="font-size: 18px; color: #4A4238;">
              <strong>Tổng cộng:</strong> ${data.totalVND.toLocaleString('vi-VN')} ₫
            </p>

            <p><strong>Địa chỉ giao hàng:</strong> ${data.shippingAddress}</p>

            <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #8C7E6A; font-size: 12px; text-align: center;">
              Ươm Archive | © 2026
            </p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      this.logger.log(`Order confirmation email sent to ${data.customerEmail}`)
    } catch (error) {
      this.logger.error('Failed to send customer confirmation email', error)
    }
  }
}
