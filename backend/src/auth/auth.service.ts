import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto, RegisterDto } from './dto'

interface TokenPayload {
  sub: string
  email: string
  role: string
}

interface Tokens {
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
      throw new ConflictException('Email already registered')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
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

  async login(dto: LoginDto): Promise<Tokens> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials')
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
    return tokens
  }

  async refreshTokens(userId: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token')
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
    return { message: 'Logged out successfully' }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
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
