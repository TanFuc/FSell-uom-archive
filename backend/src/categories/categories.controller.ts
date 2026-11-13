import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UploadService } from '../upload/upload.service'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

type RequestWithUser = ExpressRequest & {
  user?: {
    userId?: string
  }
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadProductImage(file, 'categories')
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req: RequestWithUser) {
    return this.categoriesService.create(createCategoryDto, req.user?.userId)
  }

  @Get()
  findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.categoriesService.findAll(includeDeleted === 'true', includeInactive === 'true')
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user?.userId)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.categoriesService.remove(id, req.user?.userId)
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  restore(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.categoriesService.restore(id, req.user?.userId)
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard)
  permanentDelete(@Param('id') id: string) {
    return this.categoriesService.permanentDelete(id)
  }
}
