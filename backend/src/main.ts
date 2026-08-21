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

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT') ?? 3001
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development'
  const frontendUrls = (configService.get<string>('FRONTEND_URLS') ?? frontendUrl)
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

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

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      if (nodeEnv !== 'production') {
        return callback(null, true)
      }

      if (frontendUrls.includes(origin)) {
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
    new RequestLoggingInterceptor(monitoringService),
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

void bootstrap()
