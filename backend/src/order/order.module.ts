import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { RedisModule } from '../redis'
import { SapoModule } from '../sapo/sapo.module'
import { CustomerModule } from '../customer/customer.module'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'

@Module({
  imports: [PrismaModule, RedisModule, SapoModule, CustomerModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
