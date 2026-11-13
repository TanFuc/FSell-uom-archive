import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') || 'customer-jwt-secret-dev',
    })
  }

  async validate(payload: any) {
    if (payload.type !== 'CUSTOMER') {
      throw new UnauthorizedException('Token không hợp lệ cho khách hàng')
    }

    // Verify session existence in Redis
    const sessionKey = `customer_session:${payload.sub}`
    const session = await this.redisService.get(sessionKey)
    if (!session) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc đã đăng xuất')
    }

    return {
      id: payload.sub,
      email: payload.email,
    }
  }
}
