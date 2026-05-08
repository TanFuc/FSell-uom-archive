import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
