import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { UploadController } from './upload.controller'
import { UploadService } from './upload.service'
import { CloudinaryService } from '../common/cloudinary/cloudinary.service'

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Store in memory for Sharp processing
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
