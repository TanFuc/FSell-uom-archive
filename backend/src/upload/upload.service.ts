import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudinaryService } from '../common/cloudinary/cloudinary.service'
import * as sharp from 'sharp'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor(
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async uploadProductImage(file: Express.Multer.File, folder: string = 'products'): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('Không có file được cung cấp')
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WebP, GIF')
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file vượt quá giới hạn 10MB')
    }

    try {
      // Optimize image with Sharp before uploading to Cloudinary
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 1500, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer()

      // Create a new file object with optimized buffer
      const optimizedFile: Express.Multer.File = {
        ...file,
        buffer: optimizedBuffer,
        mimetype: 'image/webp',
      }

      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadFile(optimizedFile, folder)

      this.logger.log(`Image uploaded to Cloudinary: ${result.public_id}`)
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    } catch (error) {
      this.logger.error('Failed to upload image to Cloudinary', error)
      throw new BadRequestException('Không thể xử lý và upload ảnh')
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
  ): Promise<{ urls: string[]; publicIds: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file được cung cấp')
    }

    if (files.length > 10) {
      throw new BadRequestException('Chỉ cho phép tối đa 10 ảnh')
    }

    const uploadPromises = files.map((file) => this.uploadProductImage(file))
    const results = await Promise.all(uploadPromises)

    return {
      urls: results.map((result) => result.url),
      publicIds: results.map((result) => result.publicId),
    }
  }

  async deleteFile(publicIdOrUrl: string): Promise<{ success: boolean }> {
    try {
      // Extract publicId from URL if full URL is provided
      let publicId = publicIdOrUrl

      if (publicIdOrUrl.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const urlParts = publicIdOrUrl.split('/')
        const uploadIndex = urlParts.findIndex((part) => part === 'upload')
        
        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
          // Skip version (v123456) if exists
          const afterUpload = urlParts.slice(uploadIndex + 1)
          const pathWithoutVersion = afterUpload[0].startsWith('v') ? afterUpload.slice(1) : afterUpload
          
          // Join remaining parts and remove file extension
          publicId = pathWithoutVersion.join('/').replace(/\.[^/.]+$/, '')
        }
      }

      await this.cloudinaryService.deleteFile(publicId)
      this.logger.log(`File deleted from Cloudinary: ${publicId}`)
      
      return { success: true }
    } catch (error) {
      this.logger.error('Failed to delete file from Cloudinary', error)
      throw new BadRequestException('Không thể xóa file')
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<{ success: boolean }> {
    try {
      await this.cloudinaryService.deleteMultipleFiles(publicIds)
      this.logger.log(`${publicIds.length} files deleted from Cloudinary`)
      
      return { success: true }
    } catch (error) {
      this.logger.error('Failed to delete files from Cloudinary', error)
      throw new BadRequestException('Không thể xóa files')
    }
  }
}
