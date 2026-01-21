import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: RedisClientType

  constructor(private configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    })

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err)
    })

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected')
    })
  }

  async onModuleInit() {
    await this.client.connect()
  }

  async onModuleDestroy() {
    await this.client.quit()
    this.logger.log('Redis Client Disconnected')
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  async flushAll(): Promise<void> {
    await this.client.flushAll()
  }

  // Pattern-based key deletion
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern)
    if (keys.length === 0) return 0

    await Promise.all(keys.map((key) => this.del(key)))
    return keys.length
  }

  // Multi-key operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    return this.client.mGet(keys)
  }

  async mset(keyValues: Record<string, string>): Promise<void> {
    await this.client.mSet(keyValues)
  }
}
