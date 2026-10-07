import { SetMetadata } from '@nestjs/common'

export interface RateLimitOptions {
  limit: number // Max requests in window
  ttl: number // Time-to-live in seconds
  blockDuration?: number // Block duration in seconds if threshold doubled (DDoS)
}

export const RATE_LIMIT_KEY = 'rate_limit'
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options)
