import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { CustomerAuthService } from './customer-auth.service'
import { CustomerRegisterDto } from './dto/customer-register.dto'
import { CustomerLoginDto } from './dto/customer-login.dto'
import { CustomerAuthGuard } from './customer-auth.guard'
import { RedisRateLimiterGuard } from '../common/guards/redis-rate-limiter.guard'
import { RateLimit } from '../common/decorators/rate-limit.decorator'

@Controller(['customer/auth', 'customer-auth', 'api/customer/auth', 'api/customer-auth'])
@UseGuards(RedisRateLimiterGuard)
export class CustomerAuthController {
  private readonly logger = new Logger(CustomerAuthController.name)

  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly configService: ConfigService,
  ) {}

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

  // ==============================================================================
  // FACEBOOK OAUTH 2.0 ENDPOINTS
  // ==============================================================================

  /**
   * Khởi tạo luồng đăng nhập Facebook -> Chuyển hướng người dùng sang trang cấp quyền Meta
   */
  @Get('facebook')
  @RateLimit({ limit: 30, ttl: 60 })
  async facebookLogin(
    @Req() req: any,
    @Res() res: Response,
    @Query('origin') origin?: string,
  ) {
    try {
      const clientOrigin = origin || req.headers.referer || this.configService.get<string>('FRONTEND_URL')
      const { url } = await this.customerAuthService.getFacebookAuthUrl(clientOrigin)
      return res.redirect(url)
    } catch (err: any) {
      this.logger.error('Lỗi khi tạo Facebook OAuth URL:', err?.message)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'
      return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message || 'Lỗi khởi tạo đăng nhập Facebook')}`)
    }
  }

  /**
   * Callback nhận mã ủy quyền từ Facebook, lấy thông tin và liên kết/tạo tài khoản
   */
  @Get('facebook/callback')
  @RateLimit({ limit: 10, ttl: 60, blockDuration: 600 }) // Max 10 requests/phút/IP để chống DDoS
  async facebookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const defaultFrontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    // Người dùng hủy ủy quyền hoặc Meta trả lỗi
    if (error || errorDescription) {
      this.logger.warn(`Người dùng hủy hoặc Facebook trả lỗi: ${errorDescription || error}`)
      return res.redirect(
        `${defaultFrontendUrl}?auth_error=${encodeURIComponent(errorDescription || 'Bạn đã hủy đăng nhập bằng Facebook')}`,
      )
    }

    if (!code) {
      return res.redirect(`${defaultFrontendUrl}?auth_error=${encodeURIComponent('Không nhận được mã xác thực từ Facebook')}`)
    }

    try {
      const authResult = await this.customerAuthService.handleFacebookCallback(code, state)
      const redirectUrl = new URL(authResult.frontendRedirectUrl || defaultFrontendUrl)
      redirectUrl.searchParams.set('customer_token', authResult.accessToken)
      redirectUrl.searchParams.set('customer_refresh_token', authResult.refreshToken)
      redirectUrl.searchParams.set('social_login', 'facebook')
      redirectUrl.searchParams.set('customer_name', encodeURIComponent(authResult.customer?.fullName || ''))

      return res.redirect(redirectUrl.toString())
    } catch (err: any) {
      this.logger.error('Lỗi khi xử lý Facebook Callback:', err?.message)
      return res.redirect(
        `${defaultFrontendUrl}?auth_error=${encodeURIComponent(err?.message || 'Đăng nhập bằng Facebook thất bại')}`,
      )
    }
  }

  // ==============================================================================
  // INSTAGRAM OAUTH 2.0 ENDPOINTS
  // ==============================================================================

  /**
   * Khởi tạo luồng đăng nhập Instagram -> Chuyển hướng người dùng sang trang cấp quyền Meta/Instagram
   */
  @Get('instagram')
  @RateLimit({ limit: 30, ttl: 60 })
  async instagramLogin(
    @Req() req: any,
    @Res() res: Response,
    @Query('origin') origin?: string,
  ) {
    try {
      const clientOrigin = origin || req.headers.referer || this.configService.get<string>('FRONTEND_URL')
      const { url } = await this.customerAuthService.getInstagramAuthUrl(clientOrigin)
      return res.redirect(url)
    } catch (err: any) {
      this.logger.error('Lỗi khi tạo Instagram OAuth URL:', err?.message)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'
      return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message || 'Lỗi khởi tạo đăng nhập Instagram')}`)
    }
  }

  /**
   * Callback nhận mã ủy quyền từ Instagram, lấy thông tin và liên kết/tạo tài khoản
   */
  @Get('instagram/callback')
  @RateLimit({ limit: 10, ttl: 60, blockDuration: 600 }) // Max 10 requests/phút/IP để chống DDoS
  async instagramCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const defaultFrontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    if (error || errorDescription) {
      this.logger.warn(`Người dùng hủy hoặc Instagram trả lỗi: ${errorDescription || error}`)
      return res.redirect(
        `${defaultFrontendUrl}?auth_error=${encodeURIComponent(errorDescription || 'Bạn đã hủy đăng nhập bằng Instagram')}`,
      )
    }

    if (!code) {
      return res.redirect(`${defaultFrontendUrl}?auth_error=${encodeURIComponent('Không nhận được mã xác thực từ Instagram')}`)
    }

    try {
      const authResult = await this.customerAuthService.handleInstagramCallback(code, state)
      const redirectUrl = new URL(authResult.frontendRedirectUrl || defaultFrontendUrl)
      redirectUrl.searchParams.set('customer_token', authResult.accessToken)
      redirectUrl.searchParams.set('customer_refresh_token', authResult.refreshToken)
      redirectUrl.searchParams.set('social_login', 'instagram')
      redirectUrl.searchParams.set('customer_name', encodeURIComponent(authResult.customer?.fullName || ''))

      return res.redirect(redirectUrl.toString())
    } catch (err: any) {
      this.logger.error('Lỗi khi xử lý Instagram Callback:', err?.message)
      return res.redirect(
        `${defaultFrontendUrl}?auth_error=${encodeURIComponent(err?.message || 'Đăng nhập bằng Instagram thất bại')}`,
      )
    }
  }
}
