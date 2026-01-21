import { Module, forwardRef } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
