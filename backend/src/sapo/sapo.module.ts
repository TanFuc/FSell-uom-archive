import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma'
import { RedisModule } from '../redis'
import { UploadModule } from '../upload/upload.module'
import { SapoService } from './sapo.service'
import { SapoSyncService } from './sapo-sync.service'
import { SapoSyncController } from './sapo-sync.controller'
import { SapoWebhookController } from './sapo-webhook.controller'

@Module({
  imports: [PrismaModule, RedisModule, UploadModule],
  controllers: [SapoSyncController, SapoWebhookController],
  providers: [SapoService, SapoSyncService],
  exports: [SapoService, SapoSyncService],
})
export class SapoModule {}
