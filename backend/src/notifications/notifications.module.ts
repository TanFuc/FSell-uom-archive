import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { EmailService } from './email/email.service'
import { ZaloService } from './zalo/zalo.service'
import { FacebookService } from './facebook/facebook.service'

@Module({
  providers: [NotificationsService, EmailService, ZaloService, FacebookService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
