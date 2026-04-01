import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client'
import { PrismaService } from '../prisma'
import { RedisService } from '../redis'

type HealthStatus = 'up' | 'down'

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name)
  private readonly registry = new Registry()

  private readonly httpRequestsTotal = new Counter({
    name: 'uom_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  })

  private readonly httpRequestDurationSeconds = new Histogram({
    name: 'uom_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  })

  private readonly httpRequestsInFlight = new Gauge({
    name: 'uom_http_requests_in_flight',
    help: 'Current number of in-flight HTTP requests',
    labelNames: ['method', 'route'],
    registers: [this.registry],
  })

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    collectDefaultMetrics({
      prefix: 'uom_',
      register: this.registry,
    })

    this.logger.log('Prometheus metrics initialized')
  }

  incrementInFlight(method: string, route: string) {
    this.httpRequestsInFlight.inc({ method, route })
  }

  decrementInFlight(method: string, route: string) {
    this.httpRequestsInFlight.dec({ method, route })
  }

  observeRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    const labels = {
      method,
      route,
      status_code: String(statusCode),
    }

    this.httpRequestsTotal.inc(labels)
    this.httpRequestDurationSeconds.observe(labels, durationSeconds)
  }

  getMetricsContentType() {
    return this.registry.contentType
  }

  async getMetrics() {
    return this.registry.metrics()
  }

  async getHealth() {
    const startedAt = Date.now()

    let dbStatus: HealthStatus = 'up'
    let redisStatus: HealthStatus = 'up'

    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch (error) {
      dbStatus = 'down'
      this.logger.error('Database health check failed', error)
    }

    try {
      await this.redis.ping()
    } catch (error) {
      redisStatus = 'down'
      this.logger.error('Redis health check failed', error)
    }

    const status: HealthStatus = dbStatus === 'up' && redisStatus === 'up' ? 'up' : 'down'

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTimeMs: Date.now() - startedAt,
      services: {
        api: 'up' as HealthStatus,
        database: dbStatus,
        redis: redisStatus,
      },
    }
  }

  normalizeRoute(route: string) {
    return route
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
      .replace(/\b\d+\b/g, ':id')
  }
}
