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
import { CustomerModule } from './customer/customer.module'
import { SapoModule } from './sapo/sapo.module'
import { CartModule } from './cart/cart.module'
import { OrderModule } from './order/order.module'

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
    CustomerModule,
    ProductsModule,
    CategoriesModule,
    SettingsModule,
    UploadModule,
    UsersModule,
    BannersModule,
    SapoModule,
    CartModule,
    OrderModule,
  ],
})
export class AppModule {}
