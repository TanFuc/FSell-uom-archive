import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common'
import { OrderService } from './order.service'
import { CreateOrderCheckoutDto } from './dto/create-order.dto'
import { CreateFulfillmentDto } from './dto/create-fulfillment.dto'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'
import { CustomerAuthGuard } from '../customer/customer-auth.guard'

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

  @Get(':idOrNumber')
  @RateLimit({ limit: 60, ttl: 60 })
  async getOrder(@Param('idOrNumber') idOrNumber: string) {
    return this.orderService.getOrderByIdOrNumber(idOrNumber)
  }

  /**
   * Đồng bộ lại trạng thái tracking và fulfillment từ Sapo (khi Webhook bị miss hoặc trễ)
   */
  @Post(':idOrNumber/sync-tracking')
  @RateLimit({ limit: 30, ttl: 60 })
  async syncTracking(@Param('idOrNumber') idOrNumber: string) {
    return this.orderService.syncOrderFulfillmentFromSapo(idOrNumber)
  }

  /**
   * Tạo Fulfillment trực tiếp trên Sapo: POST /admin/orders/{id}/fulfillments.json
   * Giao vận các line items và gửi email xác minh tới khách hàng.
   */
  @Post(':idOrNumber/fulfill')
  @RateLimit({ limit: 15, ttl: 60 })
  async fulfillOrder(
    @Param('idOrNumber') idOrNumber: string,
    @Body() dto: CreateFulfillmentDto,
  ) {
    return this.orderService.createFulfillment(idOrNumber, dto)
  }
}

