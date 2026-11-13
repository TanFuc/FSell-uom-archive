import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { RedisService } from '../../redis/redis.service'
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator'

@Injectable()
export class RedisRateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RedisRateLimiterGuard.name)

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const clientIp = this.getClientIp(req)
    const endpoint = req.baseUrl || req.route?.path || req.path || 'unknown'

    // 1. Check if IP is currently blacklisted due to DDoS behavior
    const blacklistKey = `blacklist:ip:${clientIp}`
    const isBlacklisted = await this.redisService.exists(blacklistKey)
    if (isBlacklisted) {
      this.logger.warn(`DDoS Defense: IP ${clientIp} is blocked from requesting ${endpoint}`)
      throw new HttpException(
        'Địa chỉ IP của bạn bị tạm khóa do gửi quá nhiều yêu cầu bất thường.',
        HttpStatus.FORBIDDEN,
      )
    }

    // 2. Retrieve route-specific or default rate limit options
    const options =
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler()) || {
        limit: 60,
        ttl: 60,
        blockDuration: 300, // 5 minutes
      }

    const rateKey = `ratelimit:${clientIp}:${endpoint}`
    const current = await this.redisService.incr(rateKey)

    if (current === 1) {
      await this.redisService.expire(rateKey, options.ttl)
    }

    // 3. DDoS Detection: If requests exceed 2x the normal limit, block IP immediately
    const ddosThreshold = options.limit * 2
    if (current > ddosThreshold) {
      const blockTime = options.blockDuration || 300
      await this.redisService.setWithTtl(blacklistKey, 'BLOCKED_DDOS', blockTime)
      this.logger.error(`[DDOS SHIELD] Automatically blocked IP ${clientIp} for ${blockTime}s (count: ${current})`)
      throw new HttpException(
        'Hệ thống phát hiện tần suất yêu cầu bất thường. IP của bạn đã bị khóa tạm thời.',
        HttpStatus.FORBIDDEN,
      )
    }

    // 4. Rate limit check
    if (current > options.limit) {
      throw new HttpException(
        'Quá nhiều yêu cầu được gửi trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].trim()
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1'
  }
}
