import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { CustomerRegisterDto } from './dto/customer-register.dto'
import { CustomerLoginDto } from './dto/customer-login.dto'

@Injectable()
export class CustomerAuthService {
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
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
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

  private async generateTokensAndSession(customer: {
    id: string
    email: string
    fullName: string
    phone?: string | null
    address?: string | null
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
      },
    }
  }
}
