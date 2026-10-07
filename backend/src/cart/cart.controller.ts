import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common'
import { CartService } from './cart.service'
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'
import { CustomerAuthGuard } from '../customer/customer-auth.guard'

@Controller('cart')
@UseGuards(RedisRateLimiterGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(CustomerAuthGuard)
  @RateLimit({ limit: 60, ttl: 60 })
  async getCart(@Req() req: any) {
    const customerId = req.user?.id
    return this.cartService.getOrCreateCart({ customerId })
  }

  @Post('add')
  @UseGuards(CustomerAuthGuard)
  @RateLimit({ limit: 40, ttl: 60 })
  async addToCart(@Body() dto: AddToCartDto, @Req() req: any) {
    const customerId = req.user?.id
    return this.cartService.addToCart(dto, customerId)
  }

  @Put('item/:id')
  @RateLimit({ limit: 60, ttl: 60 })
  async updateQuantity(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(id, dto.quantity)
  }

  @Delete('item/:id')
  @RateLimit({ limit: 60, ttl: 60 })
  async removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id)
  }
}
