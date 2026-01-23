import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma'
import { RedisModule } from './redis'
import { AuthModule } from './auth/auth.module'
import { ProductsModule } from './products/products.module'
import { CategoriesModule } from './categories/categories.module'
import { SettingsModule } from './settings/settings.module'
import { UploadModule } from './upload/upload.module'
import { UsersModule } from './users/users.module'
import { BannersModule } from './banners/banners.module'

// Orders and Notifications modules removed
// Customers now contact via social media using the Inquiry feature

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Cache
    RedisModule,

    // Feature modules
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
