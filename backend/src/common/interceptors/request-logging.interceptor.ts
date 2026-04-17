import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { MonitoringService } from '../../monitoring/monitoring.service'
import { isProbePath } from '../security/probe-paths'

type RequestUser = {
  sub?: string
  id?: string
}

type RequestWithUser = Request & {
  user?: RequestUser
}

type ErrorWithStatus = {
  status?: number
  message?: string
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API')

  constructor(private readonly monitoringService?: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now()
    const http = context.switchToHttp()
    const request = http.getRequest<RequestWithUser>()
    const response = http.getResponse<Response>()

    const method = request?.method ?? 'UNKNOWN'
    const url = request?.originalUrl ?? request?.url ?? ''
    const ip = request?.ip ?? request?.socket?.remoteAddress ?? '-'
    const userAgent = request?.headers?.['user-agent'] ?? '-'
    const userId = request?.user?.sub ?? request?.user?.id ?? '-'
    const normalizedPath = request?.path ?? url.split('?')[0] ?? 'unknown'
    const route = this.monitoringService?.normalizeRoute(normalizedPath)
    const metricRoute = route ?? 'unknown'
    const scanProbeRequest = isProbePath(url)

    this.monitoringService?.incrementInFlight(method, metricRoute)

    if (scanProbeRequest) {
      this.logger.debug(`[REQ] ${method} ${url} ip=${ip} user=${userId}`)
    } else {
      this.logger.log(`[REQ] ${method} ${url} ip=${ip} user=${userId}`)
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now
          const statusCode = response?.statusCode ?? 200
          this.monitoringService?.observeRequest(method, metricRoute, statusCode, duration / 1000)
          this.monitoringService?.decrementInFlight(method, metricRoute)
          if (scanProbeRequest && [403, 404, 429].includes(statusCode)) {
            this.logger.debug(
              `[RES] ${method} ${url} status=${statusCode} duration=${duration}ms ua="${userAgent}"`,
            )
          } else {
            this.logger.log(
              `[RES] ${method} ${url} status=${statusCode} duration=${duration}ms ua="${userAgent}"`,
            )
          }
        },
        error: (error: unknown) => {
          const requestError = error as ErrorWithStatus
          const duration = Date.now() - now
          const statusCode = requestError.status ?? response?.statusCode ?? 500
          const message = requestError.message ?? 'Unknown error'
          this.monitoringService?.observeRequest(method, metricRoute, statusCode, duration / 1000)
          this.monitoringService?.decrementInFlight(method, metricRoute)
          if (scanProbeRequest && [403, 404, 429].includes(statusCode)) {
            this.logger.debug(
              `[ERR] ${method} ${url} status=${statusCode} duration=${duration}ms message="${message}"`,
            )
          } else {
            this.logger.error(
              `[ERR] ${method} ${url} status=${statusCode} duration=${duration}ms message="${message}"`,
            )
          }
        },
      }),
    )
  }
}
