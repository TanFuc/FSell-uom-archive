import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { RedisModule } from '../redis'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'

import { CustomerModule } from '../customer/customer.module'

@Module({
  imports: [PrismaModule, RedisModule, CustomerModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
