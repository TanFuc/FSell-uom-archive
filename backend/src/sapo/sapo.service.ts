import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class SapoService {
  private readonly logger = new Logger(SapoService.name)
  private readonly client: AxiosInstance
  private readonly hostname: string

  constructor(private readonly configService: ConfigService) {
    this.hostname = (this.configService.get<string>('SAPO_HOSTNAME') || '').trim()
    const apiKey = (this.configService.get<string>('SAPO_API_KEY') || '').trim()
    const apiSecret = (this.configService.get<string>('SAPO_API_SECRET') || '').trim()
    const timeout = Number(this.configService.get<string>('SAPO_REQUEST_TIMEOUT_MS') || '10000')

    if (!this.hostname || !apiKey || !apiSecret) {
      this.logger.warn('Chưa cấu hình đầy đủ biến môi trường Sapo (SAPO_HOSTNAME, SAPO_API_KEY, SAPO_API_SECRET)')
    }

    // Kết nối chuẩn Basic Authentication cho Private App của Sapo
    this.client = axios.create({
      baseURL: `https://${this.hostname}/admin`,
      auth: {
        username: apiKey,
        password: apiSecret,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout,
    })
  }

  /**
   * Tạo đơn hàng mới trên Sapo: POST /admin/orders.json
   */
  async pushOrderToSapo(orderData: any): Promise<any> {
    try {
      this.logger.log(`Bắt đầu đẩy đơn hàng sang Sapo: ${orderData?.order?.email || 'N/A'}`)
      const response = await this.client.post('/orders.json', orderData)
      return response.data?.order
    } catch (error: any) {
      const errorMsg = error?.response?.data || error.message
      this.logger.error('Lỗi khi đẩy đơn hàng sang Sapo', errorMsg)
      throw new HttpException(
        error?.response?.data?.message || 'Không thể tạo đơn hàng trên hệ thống Sapo',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      )
    }
  }

  /**
   * Lấy danh sách sản phẩm xem trước từ Sapo: GET /admin/products.json
   */
  async getProductsPreview(page = 1, limit = 50): Promise<any[]> {
    try {
      const response = await this.client.get('/products.json', {
        params: { page, limit },
      })
      return response.data?.products || []
    } catch (error: any) {
      this.logger.error('Lỗi khi tải danh sách sản phẩm từ Sapo', error?.response?.data || error.message)
      return []
    }
  }

  /**
   * Lấy chi tiết 1 sản phẩm chính xác theo ID từ Sapo: GET /admin/products/{id}.json
   */
  async getProductDetail(sapoProductId: string | number): Promise<any> {
    try {
      const response = await this.client.get(`/products/${sapoProductId}.json`)
      return response.data?.product
    } catch (error: any) {
      this.logger.error(`Lỗi khi lấy chi tiết sản phẩm Sapo ID ${sapoProductId}`, error?.response?.data || error.message)
      throw error
    }
  }

  /**
   * Tạo một Fulfillment cho Order: POST /admin/orders/#{id}/fulfillments.json
   * Thực hiện giao vận tất cả các line item của một Order và gửi email xác minh giao vận tới khách hàng.
   * Example body:
   * {
   *   "fulfillment": {
   *     "tracking_number": "123456789",
   *     "send_notification_email": true
   *   }
   * }
   */
  async createFulfillment(
    sapoOrderId: string | number,
    data: {
      tracking_number?: string
      tracking_company?: string
      tracking_url?: string
      send_notification_email?: boolean
      line_items?: any[]
    },
  ): Promise<any> {
    try {
      this.logger.log(`Tạo fulfillment trên Sapo cho đơn hàng #${sapoOrderId}`)
      const payload: any = {
        fulfillment: {
          tracking_number: data.tracking_number,
          tracking_company: data.tracking_company || 'Chuyển phát tiêu chuẩn',
          tracking_url: data.tracking_url || null,
          send_notification_email: data.send_notification_email ?? true,
        },
      }

      if (data.line_items && data.line_items.length > 0) {
        payload.fulfillment.line_items = data.line_items
      }

      const response = await this.client.post(`/orders/${sapoOrderId}/fulfillments.json`, payload)
      this.logger.log(
        `Đã tạo fulfillment Sapo thành công cho đơn #${sapoOrderId}, tracking_number: ${response.data?.fulfillment?.tracking_number}`,
      )
      return response.data?.fulfillment
    } catch (error: any) {
      const errorMsg = error?.response?.data || error.message
      this.logger.error(`Lỗi khi gọi POST /admin/orders/${sapoOrderId}/fulfillments.json`, errorMsg)
      throw new HttpException(
        error?.response?.data?.message || 'Không thể tạo fulfillment trên Sapo',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      )
    }
  }

  /**
   * Lấy danh sách fulfillment của một đơn hàng từ Sapo: GET /admin/orders/#{id}/fulfillments.json
   * Dùng để tra cứu tracking number trực tiếp khi webhook gặp sự cố hoặc bị trễ.
   */
  async getOrderFulfillments(sapoOrderId: string | number): Promise<any[]> {
    try {
      this.logger.log(`Truy vấn danh sách fulfillments Sapo cho đơn hàng #${sapoOrderId}`)
      const response = await this.client.get(`/orders/${sapoOrderId}/fulfillments.json`)
      return response.data?.fulfillments || []
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi gọi GET /admin/orders/${sapoOrderId}/fulfillments.json`,
        error?.response?.data || error.message,
      )
      return []
    }
  }

  /**
   * Lấy chi tiết toàn bộ đơn hàng từ Sapo: GET /admin/orders/#{id}.json
   */
  async getOrderDetail(sapoOrderId: string | number): Promise<any> {
    try {
      this.logger.log(`Truy vấn chi tiết đơn hàng Sapo #${sapoOrderId}`)
      const response = await this.client.get(`/orders/${sapoOrderId}.json`)
      return response.data?.order || null
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi gọi GET /admin/orders/${sapoOrderId}.json`,
        error?.response?.data || error.message,
      )
      return null
    }
  }
}
