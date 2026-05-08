import { Module } from '@nestjs/common'
import { RedisModule } from '../redis'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
  imports: [RedisModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
