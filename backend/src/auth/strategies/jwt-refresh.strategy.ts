import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { PrismaService } from '../../prisma/prisma.service'

interface JwtRefreshPayload {
  sub: string
  email: string
  role: string
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private prisma: PrismaService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET')
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtRefreshPayload): Promise<JwtRefreshPayload> {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new UnauthorizedException('No refresh token provided')
    }

    const refreshToken = authHeader.replace('Bearer ', '').trim()

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token mismatch')
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    }
  }
}
