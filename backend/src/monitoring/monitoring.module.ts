import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { RedisModule } from '../redis'
import { MonitoringController } from './monitoring.controller'
import { MonitoringService } from './monitoring.service'

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
