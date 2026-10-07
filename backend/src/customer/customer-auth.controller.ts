import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CustomerAuthService } from './customer-auth.service'
import { CustomerRegisterDto } from './dto/customer-register.dto'
import { CustomerLoginDto } from './dto/customer-login.dto'
import { CustomerAuthGuard } from './customer-auth.guard'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'

@Controller('customer/auth')
@UseGuards(RedisRateLimiterGuard)
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  @RateLimit({ limit: 10, ttl: 60, blockDuration: 600 }) // Max 10 attempts per minute, block 10m on DDoS
  async register(@Body() dto: CustomerRegisterDto) {
    return this.customerAuthService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 15, ttl: 60, blockDuration: 600 }) // Max 15 attempts per minute
  async login(@Body() dto: CustomerLoginDto) {
    return this.customerAuthService.login(dto)
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  async getProfile(@Req() req: any) {
    return this.customerAuthService.getProfile(req.user.id)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerAuthGuard)
  async logout(@Req() req: any) {
    return this.customerAuthService.logout(req.user.id)
  }
}
