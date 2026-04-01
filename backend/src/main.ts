import { join } from 'path'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import * as express from 'express'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { loginPayloadNormalizerMiddleware } from './common/middleware/login-payload-normalizer.middleware'
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

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Non-browser clients (no origin) are allowed.
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

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter())

  // Global interceptors
  const monitoringService = app.get(MonitoringService)
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(monitoringService),
    new TransformInterceptor(),
  )

  // API prefix
  app.setGlobalPrefix('api')

  // Accept non-JSON clients for login and normalize payload to { email, password }.
  app.use('/api/auth/login', express.text({ type: '*/*', limit: '1mb' }))
  app.use('/api/auth/login', loginPayloadNormalizerMiddleware)

  // Static files (uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  })

  // Swagger documentation (only in development)
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

  await app.listen(port, '0.0.0.0')
  logger.log(`Application running on http://localhost:${port}`)
  logger.log(`Environment: ${nodeEnv}`)
}

void bootstrap()
