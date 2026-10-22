import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { createOrderAccessToken } from '../order/order-access'

export interface OrderEmailData {
  id?: string
  orderNumber: string
  customerEmail: string
  customerName: string
  phoneNumber: string
  shippingAddress: string
  note?: string | null
  totalVND: number
  status: string
  paymentMethod?: string | null
  paymentStatus?: string | null
  paymentProofUrl?: string | null
  createdAt?: Date | string
  items: Array<{
    productTitle: string
    productSku?: string | null
    productImage?: string | null
    quantity: number
    priceVND: number
  }>
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | null = null

  constructor(private readonly configService: ConfigService) {
    this.initTransporter()
  }

  private initTransporter() {
    const host =
      this.configService.get<string>('SMTP_HOST') ||
      this.configService.get<string>('GF_SMTP_HOST') ||
      ''
    const user =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('GF_SMTP_USER') ||
      ''
    const pass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('SMTP_PASSWORD') ||
      this.configService.get<string>('GF_SMTP_PASSWORD') ||
      ''
    const port = Number(
      this.configService.get<string>('SMTP_PORT') ||
        (this.configService.get<string>('GF_SMTP_HOST') ? '465' : '587'),
    )
    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      })
      this.logger.log(`SMTP Transporter initialized for host: ${host}:${port} (${user})`)
    } else {
      this.logger.warn(
        'SMTP chưa được cấu hình (thiếu SMTP_HOST, SMTP_USER hoặc SMTP_PASS trong .env). Hệ thống sẽ ghi log nội dung email thay vì gửi thật qua internet.',
      )
    }
  }

  /**
   * Gửi email xác nhận đơn hàng cho khách hàng
   */
  async sendOrderConfirmation(order: OrderEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'https://www.uomarchive.com'
    ).replace(/\/$/, '')
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('GF_SMTP_FROM_ADDRESS') ||
      '"ƯƠM. Archive" <no-reply@uomarchive.com>'

    const paymentSecret = this.configService.get<string>('ORDER_ACCESS_SECRET') || this.configService.get<string>('JWT_ACCESS_SECRET')
    const accessToken = order.id && paymentSecret ? createOrderAccessToken(order.id, paymentSecret) : null
    const trackingUrl = `${frontendUrl}/vi/order-tracking/${encodeURIComponent(order.orderNumber)}${accessToken ? `?access=${accessToken}` : ''}`
    const formattedTotal = Number(order.totalVND).toLocaleString('vi-VN') + ' ₫'
    const createdDate = order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      : new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

    const paymentStatusBadge =
      order.paymentStatus === 'paid'
        ? '<span style="display:inline-block;padding:4px 10px;background-color:#EBF5EC;color:#1B5E20;border-radius:4px;font-size:12px;font-weight:600;">✓ ĐÃ THANH TOÁN (XÁC NHẬN)</span>'
        : order.paymentStatus === 'pending_approval' || order.paymentProofUrl
        ? '<span style="display:inline-block;padding:4px 10px;background-color:#FFF8E1;color:#F57F17;border-radius:4px;font-size:12px;font-weight:600;">⌛ ĐÃ TẢI BIÊN LAI - CHỜ DUYỆT</span>'
        : '<span style="display:inline-block;padding:4px 10px;background-color:#FFEBEE;color:#C62828;border-radius:4px;font-size:12px;font-weight:600;">CHỜ CHUYỂN KHOẢN</span>'

    const itemsHtml = (order.items || [])
      .map((item) => {
        const itemSubtotal = (item.priceVND * item.quantity).toLocaleString('vi-VN') + ' ₫'
        const itemPrice = item.priceVND.toLocaleString('vi-VN') + ' ₫'
        const imgTag = item.productImage
          ? `<img src="${item.productImage}" alt="${item.productTitle}" style="width:54px;height:54px;object-fit:cover;border-radius:4px;border:1px solid #E5E0D8;margin-right:12px;vertical-align:middle;" />`
          : ''

        return `
        <tr style="border-bottom:1px solid #EFECE6;">
          <td style="padding:14px 10px;vertical-align:middle;">
            <div style="display:flex;align-items:center;">
              ${imgTag}
              <div>
                <strong style="color:#4A4238;font-size:13px;display:block;">${item.productTitle}</strong>
                ${item.productSku ? `<span style="font-size:11px;color:#8C7E6A;">SKU: ${item.productSku}</span>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:14px 10px;text-align:center;color:#666;font-size:13px;vertical-align:middle;">
            ${item.quantity}
          </td>
          <td style="padding:14px 10px;text-align:right;color:#666;font-size:13px;vertical-align:middle;font-family:monospace;">
            ${itemPrice}
          </td>
          <td style="padding:14px 10px;text-align:right;color:#4A4238;font-weight:600;font-size:13px;vertical-align:middle;font-family:monospace;">
            ${itemSubtotal}
          </td>
        </tr>
      `
      })
      .join('')

    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đơn hàng #${order.orderNumber} - ƯƠM. Archive</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F5F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#4A4238;">
      <div style="max-width:640px;margin:30px auto;background:#FFFFFF;border:1px solid #E5E0D8;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(74,66,56,0.06);">
        
        <!-- Header -->
        <div style="background-color:#4A4238;padding:32px 24px;text-align:center;color:#FFFFFF;">
          <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:24px;letter-spacing:0.18em;text-transform:uppercase;color:#F9F7F1;">
            ƯƠM. ARCHIVE
          </h1>
          <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#D8CFBE;font-weight:300;">
            Ceramic & Art Studio
          </p>
        </div>

        <!-- Greeting & Notification -->
        <div style="padding:32px 24px 20px;border-bottom:1px solid #EFECE6;">
          <h2 style="margin:0 0 10px;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#4A4238;font-weight:600;">
            Xác nhận đơn hàng #${order.orderNumber}
          </h2>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#555;">
            Xin chào <strong>${order.customerName}</strong>,<br>
            Cảm ơn bạn đã lựa chọn những tác phẩm gốm sứ thủ công tại <strong>ƯƠM. Archive</strong>. Đơn hàng của bạn đã được tiếp nhận và xác nhận trên hệ thống.
          </p>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
            ${paymentStatusBadge}
          </div>
        </div>

        <!-- Order Summary Box -->
        <div style="padding:20px 24px;background-color:#FAF9F6;border-bottom:1px solid #EFECE6;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.7;">
            <tr>
              <td style="color:#8C7E6A;width:140px;padding:3px 0;">Mã đơn hàng:</td>
              <td style="font-weight:600;font-family:monospace;color:#4A4238;">#${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="color:#8C7E6A;padding:3px 0;">Thời gian đặt:</td>
              <td style="color:#4A4238;">${createdDate}</td>
            </tr>
            <tr>
              <td style="color:#8C7E6A;padding:3px 0;">Hình thức:</td>
              <td style="color:#4A4238;font-weight:500;">Chuyển khoản ngân hàng (Thanh toán trước / Non-COD)</td>
            </tr>
            <tr>
              <td style="color:#8C7E6A;padding:3px 0;">Người nhận:</td>
              <td style="color:#4A4238;">${order.customerName} - ${order.phoneNumber}</td>
            </tr>
            <tr>
              <td style="color:#8C7E6A;padding:3px 0;">Địa chỉ giao hàng:</td>
              <td style="color:#4A4238;">${order.shippingAddress}</td>
            </tr>
            ${
              order.note
                ? `<tr>
                    <td style="color:#8C7E6A;padding:3px 0;">Ghi chú:</td>
                    <td style="color:#777;font-style:italic;">${order.note}</td>
                  </tr>`
                : ''
            }
          </table>
        </div>

        <!-- Order Items List -->
        <div style="padding:24px;">
          <h3 style="margin:0 0 16px;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#8C7E6A;font-weight:600;">
            Chi tiết kiện hàng (${order.items?.length || 0} sản phẩm)
          </h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid #E5E0D8;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8C7E6A;text-align:left;">
                <th style="padding:8px 10px;">Tác phẩm</th>
                <th style="padding:8px 10px;text-align:center;">Số lượng</th>
                <th style="padding:8px 10px;text-align:right;">Đơn giá</th>
                <th style="padding:8px 10px;text-align:right;">Tạm tính</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:14px 10px 4px;text-align:right;font-size:13px;color:#777;">Phí vận chuyển:</td>
                <td style="padding:14px 10px 4px;text-align:right;font-size:13px;color:#4A4238;font-weight:500;">Miễn phí</td>
              </tr>
              <tr>
                <td colspan="3" style="padding:6px 10px;text-align:right;font-size:15px;font-weight:600;color:#4A4238;text-transform:uppercase;letter-spacing:0.05em;">Tổng thanh toán:</td>
                <td style="padding:6px 10px;text-align:right;font-size:18px;font-weight:bold;color:#8C7E6A;font-family:monospace;">${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Action CTA -->
        <div style="padding:0 24px 32px;text-align:center;">
          <a href="${trackingUrl}" style="display:inline-block;padding:14px 32px;background-color:#4A4238;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;border-radius:4px;box-shadow:0 2px 8px rgba(74,66,56,0.2);">
            Tra cứu hành trình đơn hàng &rarr;
          </a>
          <p style="margin:14px 0 0;font-size:11px;color:#8C7E6A;">
            Bạn cũng có thể kiểm tra hình ảnh biên nhận chuyển khoản và cập nhật hành trình vận chuyển bất kỳ lúc nào tại liên kết trên.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#FAF9F6;padding:24px;border-top:1px solid #EFECE6;text-align:center;font-size:11px;color:#8C7E6A;line-height:1.6;">
          <p style="margin:0 0 6px;font-weight:600;color:#4A4238;letter-spacing:0.05em;">ƯƠM. ARCHIVE</p>
          <p style="margin:0;">
            Email hỗ trợ: <a href="mailto:admin@uomarchive.com" style="color:#8C7E6A;text-decoration:underline;">admin@uomarchive.com</a><br>
            Website: <a href="${frontendUrl}" style="color:#8C7E6A;text-decoration:none;">${frontendUrl.replace('https://', '')}</a>
          </p>
          <p style="margin:10px 0 0;font-size:10px;color:#AAA;">
            Đây là email tự động từ hệ thống ƯƠM. Archive. Vui lòng không trả lời trực tiếp email này.
          </p>
        </div>

      </div>
    </body>
    </html>
    `

    if (!this.transporter) {
      this.logger.log(
        `[MailService SIMULATION] Đã kích hoạt gửi email cho đơn #${order.orderNumber} tới ${order.customerEmail}. (Transporter chưa bật SMTP thật)`,
      )
      return { success: true, messageId: 'simulated-local-mail' }
    }

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: order.customerEmail,
        subject: `[ƯƠM. Archive] Xác nhận đơn hàng #${order.orderNumber}`,
        html,
      })
      this.logger.log(`✓ Email xác nhận đơn #${order.orderNumber} đã gửi tới ${order.customerEmail}: ${info.messageId}`)
      return { success: true, messageId: info.messageId }
    } catch (err: any) {
      this.logger.error(
        `✗ Gửi email xác nhận đơn #${order.orderNumber} thất bại (${order.customerEmail}): ${err.message}`,
      )
      return { success: false, error: err.message }
    }
  }
}
