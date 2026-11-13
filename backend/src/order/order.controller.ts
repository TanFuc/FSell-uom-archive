import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Headers,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Role } from '@prisma/client'
import { OrderService } from './order.service'
import { CreateOrderCheckoutDto } from './dto/create-order.dto'
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'
import { CustomerAuthGuard } from '../customer/customer-auth.guard'
import { JwtAuthGuard, RolesGuard } from '../auth/guards'
import { Roles, CurrentUser, JwtPayload } from '../auth/decorators'

@Controller('orders')
@UseGuards(RedisRateLimiterGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @RateLimit({ limit: 15, ttl: 60, blockDuration: 600 }) // Giới hạn checkout chống flood đơn ảo
  async checkout(@Body() dto: CreateOrderCheckoutDto, @Req() req: any) {
    const customerId = req.user?.id || undefined
    return this.orderService.checkout(dto, customerId)
  }

  @Get('my-orders')
  @UseGuards(CustomerAuthGuard)
  async getMyOrders(@Req() req: any) {
    return this.orderService.getCustomerOrders(req.user.id)
  }

  // ==============================================================================
  // ADMIN ORDER MANAGEMENT ENDPOINTS
  // ==============================================================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAdminOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
  ) {
    return this.orderService.getAdminOrders({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      paymentStatus,
      search,
    })
  }

  @Get('admin/:idOrNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAdminOrder(@Param('idOrNumber') idOrNumber: string) {
    return this.orderService.getOrderByIdOrNumber(idOrNumber)
  }

  @Put('admin/:idOrNumber/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateOrderStatus(
    @Param('idOrNumber') idOrNumber: string,
    @Body('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.updateOrderStatus(idOrNumber, status, user?.sub)
  }

  @Put('admin/:idOrNumber/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updatePaymentStatus(
    @Param('idOrNumber') idOrNumber: string,
    @Body('paymentStatus') paymentStatus: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.updatePaymentStatus(idOrNumber, paymentStatus, user?.sub)
  }

  @Post('admin/:idOrNumber/send-confirmation-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async sendOrderConfirmationEmail(@Param('idOrNumber') idOrNumber: string) {
    return this.orderService.sendOrderConfirmationEmail(idOrNumber)
  }

  // ==============================================================================
  // CUSTOMER / PUBLIC TRACKING & PAYMENT PROOF
  // ==============================================================================

  /**
   * Khách hàng tải ảnh bằng chứng chuyển khoản (bill chuyển khoản)
   */
  @Post(':idOrNumber/payment-proof')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @RateLimit({ limit: 10, ttl: 60 })
  async uploadPaymentProof(
    @Param('idOrNumber') idOrNumber: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-order-payment-token') accessToken?: string,
  ) {
    return this.orderService.uploadPaymentProof(idOrNumber, file, accessToken)
  }

  @Post(':idOrNumber/confirm-transfer')
  @RateLimit({ limit: 10, ttl: 60 })
  async confirmTransfer(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('x-order-payment-token') accessToken?: string,
  ) {
    return this.orderService.confirmTransfer(idOrNumber, accessToken)
  }

  @Get(':idOrNumber')
  @RateLimit({ limit: 60, ttl: 60 })
  async getOrder(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('x-order-payment-token') accessToken?: string,
  ) {
    await this.orderService.assertPublicOrderAccess(idOrNumber, accessToken)
    return this.orderService.getOrderByIdOrNumber(idOrNumber)
  }

  /**
   * Đồng bộ lại trạng thái tracking và fulfillment từ Sapo (khi Webhook bị miss hoặc trễ)
   */
  @Post(':idOrNumber/sync-tracking')
  @RateLimit({ limit: 30, ttl: 60 })
  async syncTracking(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('x-order-payment-token') accessToken?: string,
  ) {
    await this.orderService.assertPublicOrderAccess(idOrNumber, accessToken)
    return this.orderService.syncOrderFulfillmentFromSapo(idOrNumber)
  }

  /**
   * Tạo Fulfillment trực tiếp trên Sapo: POST /admin/orders/{id}/fulfillments.json
   */
  @Post(':idOrNumber/fulfill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @RateLimit({ limit: 15, ttl: 60 })
  async fulfillOrder(
    @Param('idOrNumber') idOrNumber: string,
    @Body() dto: CreateFulfillmentDto,
  ) {
    return this.orderService.createFulfillment(idOrNumber, dto)
  }
}
