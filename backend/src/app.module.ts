import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { BannersModule } from './banners/banners.module'
import { CategoriesModule } from './categories/categories.module'
import { MonitoringModule } from './monitoring/monitoring.module'
import { PrismaModule } from './prisma'
import { ProductsModule } from './products/products.module'
import { RedisModule } from './redis'
import { SettingsModule } from './settings/settings.module'
import { UploadModule } from './upload/upload.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    PrismaModule,

    RedisModule,

    MonitoringModule,

    AuthModule,
    ProductsModule,
    CategoriesModule,
    SettingsModule,
    UploadModule,
    UsersModule,
    BannersModule,
  ],
})
export class AppModule {}
