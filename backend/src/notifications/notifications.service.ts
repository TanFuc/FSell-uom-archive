import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from './email/email.service'
import { ZaloService } from './zalo/zalo.service'
import { FacebookService } from './facebook/facebook.service'
import { Order, OrderItem, Product } from '@prisma/client'

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[]
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private emailService: EmailService,
    private zaloService: ZaloService,
    private facebookService: FacebookService,
  ) {}

  async sendOrderNotifications(order: OrderWithItems): Promise<void> {
    this.logger.log(`Sending notifications for order ${order.orderNumber}`)

    const emailData = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      phoneNumber: order.phoneNumber,
      shippingAddress: order.shippingAddress,
      totalVND: order.totalVND,
      items: order.items.map((item) => ({
        name: order.language === 'VI' ? item.product.nameVi : item.product.nameEn,
        quantity: item.quantity,
        price: item.priceVND,
      })),
    }

    // Send all notifications in parallel (non-blocking)
    const promises = [
      this.emailService.sendOrderNotificationToAdmin(emailData).catch((err) => {
        this.logger.error('Email notification to admin failed', err)
      }),
      this.emailService.sendOrderConfirmationToCustomer(emailData).catch((err) => {
        this.logger.error('Customer email failed', err)
      }),
      this.zaloService
        .sendOrderNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalVND: order.totalVND,
          phoneNumber: order.phoneNumber,
        })
        .catch((err) => {
          this.logger.error('Zalo notification failed', err)
        }),
      this.facebookService
        .sendOrderNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalVND: order.totalVND,
          items: order.items.map((item) => ({
            name: item.product.nameVi,
            quantity: item.quantity,
          })),
        })
        .catch((err) => {
          this.logger.error('Facebook notification failed', err)
        }),
    ]

    await Promise.allSettled(promises)
    this.logger.log('All notifications sent (or attempted)')
  }

  async testEmailNotification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const testData = {
        orderNumber: 'TEST-' + Date.now(),
        customerName: 'Test Customer',
        customerEmail: email,
        phoneNumber: '0912345678',
        shippingAddress: '123 Test Street, Test City',
        totalVND: 1000000,
        items: [{ name: 'Test Product', quantity: 1, price: 1000000 }],
      }

      await this.emailService.sendOrderNotificationToAdmin(testData)
      return { success: true, message: `Test email sent to ${email}` }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, message: errorMessage }
    }
  }

  async testZaloNotification(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.zaloService.sendOrderNotification({
        orderNumber: 'TEST-' + Date.now(),
        customerName: 'Test Customer',
        totalVND: 1000000,
        phoneNumber: phone,
      })
      return { success: true, message: `Test Zalo notification sent to ${phone}` }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, message: errorMessage }
    }
  }
}
