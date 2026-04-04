import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto'

export interface TokenPayload {
  sub: string
  email: string
  role: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<Tokens> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.email.split('@')[0],
      },
    })

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Store refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken)

    this.logger.log(`User registered: ${user.email}`)
    return tokens
  }

  async login(
    dto: LoginDto,
  ): Promise<Tokens & { user: { id: string; email: string; fullName: string; role: string } }> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác')
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác')
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Store refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken)

    this.logger.log(`User logged in: ${user.email}`)

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    }
  }

  async refreshTokens(userId: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ')
    }

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Store new refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken)

    this.logger.log(`Tokens refreshed for: ${user.email}`)
    return tokens
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })

    this.logger.log(`User logged out: ${userId}`)
    return { message: 'Đăng xuất thành công' }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng')
    }

    return user
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!dto.email && !dto.newPassword) {
      throw new BadRequestException('No profile changes provided')
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng')
    }

    if (dto.newPassword && !dto.currentPassword) {
      throw new BadRequestException('Current password is required to change password')
    }

    if (dto.currentPassword && !dto.newPassword) {
      throw new BadRequestException('New password is required')
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      })

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(`User with email "${dto.email}" already exists`)
      }
    }

    const updateData: { email?: string; passwordHash?: string } = {}

    if (dto.email && dto.email !== user.email) {
      updateData.email = dto.email
    }

    if (dto.newPassword && dto.currentPassword) {
      const currentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash)
      if (!currentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect')
      }

      updateData.passwordHash = await bcrypt.hash(dto.newPassword, 10)
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    })

    this.logger.log(`User profile updated: ${updated.email}`)
    return updated
  }

  private async generateTokens(payload: TokenPayload): Promise<Tokens> {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m'
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured')
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiration,
      }),
    ])

    return { accessToken, refreshToken }
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    })
  }
}
