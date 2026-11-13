import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import axios from 'axios'
import { AuthProvider } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { CustomerRegisterDto } from './dto/customer-register.dto'
import { CustomerLoginDto } from './dto/customer-login.dto'

export interface SocialProfilePayload {
  provider: AuthProvider
  socialId: string
  email?: string | null
  fullName: string
  avatarUrl?: string | null
}

@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CustomerRegisterDto) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        email: dto.email.toLowerCase().trim(),
        deletedAt: null,
      },
    })

    if (existing) {
      throw new BadRequestException('Email đã được đăng ký trên hệ thống')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const customer = await this.prisma.customer.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        authProvider: AuthProvider.LOCAL,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        authProvider: true,
        createdAt: true,
      },
    })

    return this.generateTokensAndSession(customer)
  }

  async login(dto: CustomerLoginDto) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        email: dto.email.toLowerCase().trim(),
        deletedAt: null,
      },
    })

    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác')
    }

    if (!customer.passwordHash) {
      throw new UnauthorizedException(
        'Tài khoản này được đăng ký thông qua mạng xã hội (Facebook/Instagram). Vui lòng đăng nhập bằng nút mạng xã hội tương ứng.',
      )
    }

    const isMatch = await bcrypt.compare(dto.password, customer.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác')
    }

    return this.generateTokensAndSession({
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      avatarUrl: customer.avatarUrl,
      authProvider: customer.authProvider,
    })
  }

  async getProfile(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        authProvider: true,
        createdAt: true,
      },
    })

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng')
    }

    return customer
  }

  async logout(customerId: string) {
    const sessionKey = `customer_session:${customerId}`
    await this.redisService.del(sessionKey)
    return { success: true, message: 'Đăng xuất thành công' }
  }

  // ==============================================================================
  // FACEBOOK OAUTH 2.0
  // ==============================================================================
  async getFacebookAuthUrl(clientOrigin?: string): Promise<{ url: string; state: string }> {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID')?.trim()
    const callbackUrl =
      this.configService.get<string>('FACEBOOK_CALLBACK_URL')?.trim() ||
      'http://localhost:3006/customer/auth/facebook/callback'

    if (!appId) {
      throw new BadRequestException('Hệ thống chưa cấu hình FACEBOOK_APP_ID')
    }

    const state = crypto.randomBytes(16).toString('hex')
    const stateKey = `oauth_state:${state}`
    const frontendUrl =
      clientOrigin || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    // Store state in Redis with 10 minutes TTL to prevent CSRF
    await this.redisService.setWithTtl(
      stateKey,
      JSON.stringify({ provider: 'facebook', frontendUrl }),
      600,
    )

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      state,
      scope: 'email,public_profile',
      response_type: 'code',
    })

    const url = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
    return { url, state }
  }

  async handleFacebookCallback(code: string, state?: string) {
    const appId = this.configService.get<string>('FACEBOOK_APP_ID')?.trim()
    const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET')?.trim()
    const callbackUrl =
      this.configService.get<string>('FACEBOOK_CALLBACK_URL')?.trim() ||
      'http://localhost:3006/customer/auth/facebook/callback'
    const defaultFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    let targetFrontendUrl = defaultFrontendUrl

    if (state) {
      const stateKey = `oauth_state:${state}`
      const stateData = await this.redisService.get(stateKey)
      if (stateData) {
        try {
          const parsed = JSON.parse(stateData)
          if (parsed.frontendUrl) {
            targetFrontendUrl = parsed.frontendUrl
          }
        } catch {
          // ignore json parse error
        }
        await this.redisService.del(stateKey)
      }
    }

    if (!appId || !appSecret) {
      throw new BadRequestException('Hệ thống chưa cấu hình đầy đủ thông tin Facebook App')
    }

    // 1. Exchange authorization code for access_token
    let accessToken = ''
    try {
      const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: callbackUrl,
          code,
        },
        timeout: 10000,
      })
      accessToken = tokenRes.data?.access_token
    } catch (err: any) {
      this.logger.error('Lỗi khi lấy Facebook Access Token:', err?.response?.data || err?.message)
      throw new BadRequestException(
        err?.response?.data?.error?.message || 'Không thể xác thực với Facebook. Mã code không hợp lệ hoặc đã hết hạn.',
      )
    }

    // 2. Fetch user profile from Facebook Graph API
    let fbProfile: any = null
    try {
      const profileRes = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          fields: 'id,name,email,picture.width(400).height(400)',
          access_token: accessToken,
        },
        timeout: 10000,
      })
      fbProfile = profileRes.data
    } catch (err: any) {
      this.logger.error('Lỗi khi tải thông tin tài khoản Facebook:', err?.response?.data || err?.message)
      throw new BadRequestException('Không thể lấy thông tin tài khoản từ Facebook')
    }

    const socialId = String(fbProfile.id)
    const fullName = fbProfile.name || 'Người dùng Facebook'
    const email = fbProfile.email ? String(fbProfile.email).toLowerCase().trim() : null
    const avatarUrl = fbProfile.picture?.data?.url || null

    // 3. Process social login & merge account logic
    const authResult = await this.handleSocialLogin({
      provider: AuthProvider.FACEBOOK,
      socialId,
      email,
      fullName,
      avatarUrl,
    })

    return {
      ...authResult,
      frontendRedirectUrl: targetFrontendUrl,
    }
  }

  // ==============================================================================
  // INSTAGRAM OAUTH 2.0
  // ==============================================================================
  async getInstagramAuthUrl(clientOrigin?: string): Promise<{ url: string; state: string }> {
    const appId = this.configService.get<string>('INSTAGRAM_APP_ID')?.trim()
    const callbackUrl =
      this.configService.get<string>('INSTAGRAM_CALLBACK_URL')?.trim() ||
      'http://localhost:3006/customer/auth/instagram/callback'

    if (!appId) {
      throw new BadRequestException('Hệ thống chưa cấu hình INSTAGRAM_APP_ID')
    }

    const state = crypto.randomBytes(16).toString('hex')
    const stateKey = `oauth_state:${state}`
    const frontendUrl =
      clientOrigin || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    await this.redisService.setWithTtl(
      stateKey,
      JSON.stringify({ provider: 'instagram', frontendUrl }),
      600,
    )

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      state,
      scope: 'user_profile,user_media',
      response_type: 'code',
    })

    const url = `https://api.instagram.com/oauth/authorize?${params.toString()}`
    return { url, state }
  }

  async handleInstagramCallback(code: string, state?: string) {
    const appId = this.configService.get<string>('INSTAGRAM_APP_ID')?.trim()
    const appSecret = this.configService.get<string>('INSTAGRAM_APP_SECRET')?.trim()
    const callbackUrl =
      this.configService.get<string>('INSTAGRAM_CALLBACK_URL')?.trim() ||
      'http://localhost:3006/customer/auth/instagram/callback'
    const defaultFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'

    let targetFrontendUrl = defaultFrontendUrl

    if (state) {
      const stateKey = `oauth_state:${state}`
      const stateData = await this.redisService.get(stateKey)
      if (stateData) {
        try {
          const parsed = JSON.parse(stateData)
          if (parsed.frontendUrl) {
            targetFrontendUrl = parsed.frontendUrl
          }
        } catch {
          // ignore
        }
        await this.redisService.del(stateKey)
      }
    }

    if (!appId || !appSecret) {
      throw new BadRequestException('Hệ thống chưa cấu hình đầy đủ thông tin Instagram App')
    }

    // 1. Exchange authorization code for Instagram access token
    let accessToken = ''
    let userId = ''
    try {
      const formData = new URLSearchParams()
      formData.append('client_id', appId)
      formData.append('client_secret', appSecret)
      formData.append('grant_type', 'authorization_code')
      formData.append('redirect_uri', callbackUrl)
      formData.append('code', code)

      const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      })

      accessToken = tokenRes.data?.access_token
      userId = String(tokenRes.data?.user_id)
    } catch (err: any) {
      this.logger.error('Lỗi khi lấy Instagram Access Token:', err?.response?.data || err?.message)
      throw new BadRequestException(
        err?.response?.data?.error_message || 'Không thể xác thực với Instagram. Vui lòng thử lại.',
      )
    }

    // 2. Fetch profile from Instagram Basic Display / Graph API
    let igProfile: any = null
    try {
      const profileRes = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type',
          access_token: accessToken,
        },
        timeout: 10000,
      })
      igProfile = profileRes.data
    } catch (err: any) {
      this.logger.warn('Lấy chi tiết profile Instagram thất bại, dùng user_id mặc định:', err?.message)
      igProfile = { id: userId, username: `instagram_user_${userId}` }
    }

    const socialId = String(igProfile?.id || userId)
    const username = igProfile?.username || `instagram_${socialId}`
    const fullName = username ? `@${username}` : 'Instagram User'

    // Instagram Basic Display API does not provide email.
    // Fallback to null or temporary email: ig_12345@uomarchive.com
    const fallbackEmail = `ig_${socialId}@uomarchive.com`

    // 3. Process social login & merge account logic
    const authResult = await this.handleSocialLogin({
      provider: AuthProvider.INSTAGRAM,
      socialId,
      email: fallbackEmail,
      fullName,
      avatarUrl: null,
    })

    return {
      ...authResult,
      frontendRedirectUrl: targetFrontendUrl,
    }
  }

  // ==============================================================================
  // ACCOUNT MERGE & SOCIAL LOGIN CORE LOGIC
  // ==============================================================================
  private async handleSocialLogin(payload: SocialProfilePayload) {
    const { provider, socialId, email, fullName, avatarUrl } = payload
    const isFacebook = provider === AuthProvider.FACEBOOK

    // 1. Kiểm tra xem tài khoản đã từng đăng nhập bằng mạng xã hội này chưa (theo socialId)
    let customer = await this.prisma.customer.findFirst({
      where: {
        ...(isFacebook ? { facebookId: socialId } : { instagramId: socialId }),
        deletedAt: null,
      },
    })

    if (customer) {
      // Đã có tài khoản liên kết -> Cập nhật avatar hoặc thông tin nếu cần
      if (avatarUrl && !customer.avatarUrl) {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: { avatarUrl, updatedAt: new Date() },
        })
      }
      this.logger.log(`Khách hàng ${customer.fullName} (${customer.id}) đăng nhập thành công qua ${provider}`)
      return this.generateTokensAndSession(customer)
    }

    // 2. Nếu chưa có socialId: Kiểm tra xem hệ thống đã có tài khoản trùng Email chưa
    // KHÔNG MẤT DỮ LIỆU: Tự động liên kết (MERGE) tài khoản thay vì báo lỗi hoặc tạo mới đè lên
    if (email) {
      const existingCustomerWithEmail = await this.prisma.customer.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          deletedAt: null,
        },
      })

      if (existingCustomerWithEmail) {
        this.logger.log(
          `Phát hiện tài khoản email trùng khớp (${email}) - Tự động liên kết (Merge) tài khoản ID: ${existingCustomerWithEmail.id} với ${provider} (ID: ${socialId})`,
        )

        customer = await this.prisma.customer.update({
          where: { id: existingCustomerWithEmail.id },
          data: {
            ...(isFacebook ? { facebookId: socialId } : { instagramId: socialId }),
            avatarUrl: existingCustomerWithEmail.avatarUrl || avatarUrl || null,
            updatedAt: new Date(),
          },
        })

        return this.generateTokensAndSession(customer)
      }
    }

    // 3. Người dùng hoàn toàn mới -> Tạo mới Customer
    this.logger.log(`Tạo tài khoản khách hàng mới qua ${provider} (Social ID: ${socialId})`)
    customer = await this.prisma.customer.create({
      data: {
        email: email ? email.toLowerCase().trim() : null,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || null,
        authProvider: provider,
        facebookId: isFacebook ? socialId : null,
        instagramId: !isFacebook ? socialId : null,
        passwordHash: null,
        isActive: true,
      },
    })

    return this.generateTokensAndSession(customer)
  }

  // ==============================================================================
  // TOKEN & REDIS SESSION CREATION
  // ==============================================================================
  private async generateTokensAndSession(customer: {
    id: string
    email: string | null
    fullName: string
    phone?: string | null
    address?: string | null
    avatarUrl?: string | null
    authProvider?: AuthProvider
  }) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'CUSTOMER',
    }

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'customer-jwt-secret-dev'
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'customer-refresh-secret-dev'

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: '15m',
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    })

    // Store Session in Redis: TTL 7 days (604800 seconds)
    const sessionKey = `customer_session:${customer.id}`
    await this.redisService.setWithTtl(
      sessionKey,
      JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        refreshToken,
        lastLoginAt: new Date().toISOString(),
      }),
      7 * 24 * 60 * 60,
    )

    return {
      accessToken,
      refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        avatarUrl: customer.avatarUrl,
        authProvider: customer.authProvider,
      },
    }
  }
}
