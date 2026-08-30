import { join } from 'path'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as express from 'express'
import { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { loginPayloadNormalizerMiddleware } from './common/middleware/login-payload-normalizer.middleware'
import {
  extractRequestPath,
  isHardBlockedProbePath,
  isProbePath,
  isProbeRateLimited,
} from './common/security/probe-paths'
import { MonitoringService } from './monitoring/monitoring.service'

const DEFAULT_PUBLIC_CACHE_MAX_AGE_SECONDS = 300
const DEFAULT_PUBLIC_CACHE_S_MAXAGE_SECONDS = 3600
const DEFAULT_PUBLIC_CACHE_STALE_WHILE_REVALIDATE_SECONDS = 86400

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback
}

function isPublicCacheableApiRequest(req: Request): boolean {
  if (!['GET', 'HEAD'].includes(req.method)) return false
  if (req.headers.authorization ?? req.headers.cookie) return false

  const path = extractRequestPath(req)

  if (
    path.startsWith('/auth') ||
    path.startsWith('/upload') ||
    path.includes('/admin') ||
    path.includes('/bulk')
  ) {
    return false
  }

  if (path === '/products' || path.startsWith('/products/')) {
    return true
  }

  if (path === '/categories' || path.startsWith('/categories/slug/')) {
    return req.query.includeDeleted !== 'true' && req.query.includeInactive !== 'true'
  }

  if (path === '/banners' || path.startsWith('/banners/')) {
    return true
  }

  if (path === '/settings' || path.startsWith('/settings/')) {
    return true
  }

  return false
}

let bootstrapPromise: Promise<void> | undefined

async function startApplication(): Promise<void> {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)
  const rawPort = process.env.PORT ?? '3001'
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${rawPort}`)
  }
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development'
  const requestLoggingEnabled =
    configService.get<string>('REQUEST_LOGGING_ENABLED') === 'true' || nodeEnv !== 'production'
  const slowRequestLoggingMs = Number(
    configService.get<string>('SLOW_REQUEST_LOGGING_MS') ?? '1500',
  )
  const publicCacheMaxAgeSeconds = readPositiveInt(
    configService.get<string>('PUBLIC_CACHE_MAX_AGE_SECONDS'),
    DEFAULT_PUBLIC_CACHE_MAX_AGE_SECONDS,
  )
  const publicCacheSMaxAgeSeconds = readPositiveInt(
    configService.get<string>('PUBLIC_CACHE_S_MAXAGE_SECONDS'),
    DEFAULT_PUBLIC_CACHE_S_MAXAGE_SECONDS,
  )
  const publicCacheStaleWhileRevalidateSeconds = readPositiveInt(
    configService.get<string>('PUBLIC_CACHE_STALE_WHILE_REVALIDATE_SECONDS'),
    DEFAULT_PUBLIC_CACHE_STALE_WHILE_REVALIDATE_SECONDS,
  )
  const frontendUrls = Array.from(
    new Set(
      [
        frontendUrl,
        configService.get<string>('APP_URL'),
        configService.get<string>('NEXT_PUBLIC_APP_URL'),
        ...(configService.get<string>('FRONTEND_URLS') ?? '').split(','),
        'https://uomarchive.com',
        'https://www.uomarchive.com',
        'http://uomarchive.com',
        'http://www.uomarchive.com',
      ]
        .map((url) => url?.trim().replace(/\/$/, ''))
        .filter(Boolean) as string[],
    ),
  )
  const publicCacheControlHeader = [
    'public',
    `max-age=${publicCacheMaxAgeSeconds}`,
    `s-maxage=${publicCacheSMaxAgeSeconds}`,
    `stale-while-revalidate=${publicCacheStaleWhileRevalidateSeconds}`,
  ].join(', ')

  app.set('etag', 'weak')

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestPath = extractRequestPath(req)

    if (
      ['GET', 'HEAD'].includes(req.method) &&
      (requestPath === '/' || requestPath === '' || requestPath === '/health')
    ) {
      res.setHeader('Cache-Control', 'no-store')
      return res.status(200).json({
        status: 'ok',
        service: 'uom-archive-api',
      })
    }

    if (['GET', 'HEAD'].includes(req.method) && requestPath === '/favicon.ico') {
      res.setHeader('Cache-Control', 'public, max-age=86400')
      return res.status(204).send()
    }

    return next()
  })

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestPath = extractRequestPath(req)

    if (isHardBlockedProbePath(requestPath)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Forbidden',
      })
    }

    if (isProbePath(requestPath)) {
      if (isProbeRateLimited(req)) {
        return res.status(429).json({
          statusCode: 429,
          message: 'Too many requests',
        })
      }

      return res.status(404).json({
        statusCode: 404,
        message: 'Not Found',
      })
    }

    return next()
  })

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isPublicCacheableApiRequest(req)) {
      res.setHeader('Cache-Control', publicCacheControlHeader)
      res.setHeader('Vary', 'Accept-Encoding')
    }

    return next()
  })

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (nodeEnv !== 'production') {
        return callback(null, true)
      }

      if (frontendUrls.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  const monitoringService = app.get(MonitoringService)
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(monitoringService, {
      logRequests: requestLoggingEnabled,
      slowRequestMs:
        Number.isFinite(slowRequestLoggingMs) && slowRequestLoggingMs > 0
          ? slowRequestLoggingMs
          : 1500,
    }),
    new TransformInterceptor(),
  )

  // app.setGlobalPrefix('api')

  app.use('/auth/login', express.text({ type: '*/*', limit: '1mb' }))
  app.use('/auth/login', loginPayloadNormalizerMiddleware)

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  })

  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('ƯƠM. Archive API')
      .setDescription('E-commerce API for ƯƠM. Archive - Minimalist design shop')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('products', 'Product management')
      .addTag('orders', 'Order management')
      .addTag('settings', 'Site settings management')
      .addTag('upload', 'File upload')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)

    logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`)
  }

  const server = await app.listen(port, '0.0.0.0')
  server.keepAliveTimeout = 5000
  server.headersTimeout = 6000
  server.requestTimeout = 15000
  logger.log(`Application running on http://localhost:${port}`)
  logger.log(`Environment: ${nodeEnv}`)
}

export function bootstrap(): Promise<void> {
  bootstrapPromise ??= startApplication()
  return bootstrapPromise
}

void bootstrap()
