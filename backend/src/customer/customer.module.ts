import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { PrismaModule } from '../prisma'
import { RedisModule } from '../redis'
import { CustomerAuthController } from './customer-auth.controller'
import { CustomerAuthService } from './customer-auth.service'
import { CustomerJwtStrategy } from './customer-jwt.strategy'
import { CustomerAuthGuard } from './customer-auth.guard'

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerJwtStrategy, CustomerAuthGuard],
  exports: [CustomerAuthService, CustomerAuthGuard],
})
export class CustomerModule {}
