import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as sharp from 'sharp'
import * as fs from 'fs/promises'
import * as path from 'path'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)
  private readonly uploadDir = './uploads/products'

  constructor(private configService: ConfigService) {}

  async uploadProductImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided')
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit')
    }

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `${timestamp}-${originalName}.webp`
    const filepath = path.join(this.uploadDir, filename)

    try {
      // Optimize and convert image with Sharp
      await sharp(file.buffer)
        .resize(1200, 1500, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(filepath)

      // Return public URL
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001'
      const url = `${baseUrl}/uploads/products/${filename}`

      this.logger.log(`Image uploaded: ${filename}`)
      return { url }
    } catch (error) {
      this.logger.error('Failed to process image', error)
      throw new BadRequestException('Failed to process image')
    }
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided')
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed')
    }

    const uploadPromises = files.map((file) => this.uploadProductImage(file))
    const results = await Promise.all(uploadPromises)
    const urls = results.map((result) => result.url)

    return { urls }
  }

  async deleteFile(fileUrl: string): Promise<{ success: boolean }> {
    try {
      // Extract filename from URL
      const filename = fileUrl.split('/').pop()
      if (!filename) {
        throw new BadRequestException('Invalid file URL')
      }

      const filepath = path.join(this.uploadDir, filename)

      // Check if file exists
      try {
        await fs.access(filepath)
      } catch {
        this.logger.warn(`File not found for deletion: ${filename}`)
        return { success: true } // File doesn't exist, consider it deleted
      }

      await fs.unlink(filepath)
      this.logger.log(`File deleted: ${filename}`)
      return { success: true }
    } catch (error) {
      this.logger.error('Failed to delete file', error)
      throw new BadRequestException('Failed to delete file')
    }
  }
}
