import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CloudinaryService } from '../common/cloudinary/cloudinary.service'
import * as sharp from 'sharp'
import { randomUUID } from 'crypto'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

type UploadProvider = 'cloudinary' | 'r2'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)
  private readonly uploadProvider: UploadProvider
  private readonly s3Client?: S3Client
  private readonly r2Bucket: string
  private readonly r2PublicUrl: string

  constructor(
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.uploadProvider = (this.configService.get<string>('UPLOAD_PROVIDER') ||
      'cloudinary') as UploadProvider
    this.r2Bucket = this.configService.get<string>('R2_BUCKET') || ''
    this.r2PublicUrl = (this.configService.get<string>('R2_PUBLIC_URL') || '').replace(/\/$/, '')

    if (this.uploadProvider === 'r2') {
      const endpoint = this.configService.get<string>('R2_ENDPOINT') || ''
      const accessKeyId = this.configService.get<string>('R2_KEY') || ''
      const secretAccessKey = this.configService.get<string>('R2_SECRET') || ''

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    }
  }

  async uploadProductImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('Không có file được cung cấp')
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WebP, GIF',
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Kích thước file vượt quá giới hạn 10MB')
    }

    try {
      // Resize + optimize + sharpen for crisp but lightweight delivery.
      const optimizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3,
        })
        .sharpen({ sigma: 1.1, m1: 1, m2: 2, x1: 2, y2: 10, y3: 20 })
        .webp({ quality: 88, effort: 6, smartSubsample: true })
        .toBuffer()

      if (this.uploadProvider === 'r2') {
        const result = await this.uploadToR2(optimizedBuffer, folder)
        this.logger.log(`Image uploaded to R2: ${result.publicId}`)
        return result
      }

      const optimizedFile: Express.Multer.File = {
        ...file,
        buffer: optimizedBuffer,
        mimetype: 'image/webp',
      }

      const result = await this.cloudinaryService.uploadFile(optimizedFile, folder)
      this.logger.log(`Image uploaded to Cloudinary: ${result.public_id}`)

      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    } catch (error) {
      this.logger.error('Failed to process/upload image', error)
      throw new BadRequestException('Không thể xử lý và upload ảnh')
    }
  }

  private async uploadToR2(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    if (!this.s3Client) {
      throw new BadRequestException('R2 client chưa được cấu hình')
    }
    if (!this.r2Bucket) {
      throw new BadRequestException('Thiếu R2_BUCKET trong biến môi trường')
    }
    if (!this.r2PublicUrl) {
      throw new BadRequestException('Thiếu R2_PUBLIC_URL trong biến môi trường')
    }

    const safeFolder = (folder || 'products').replace(/^\/+|\/+$/g, '')
    const key = `${safeFolder}/${Date.now()}-${randomUUID()}.webp`

    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    })

    await this.s3Client.send(command)

    return {
      url: `${this.r2PublicUrl}/${key}`,
      publicId: key,
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
      if (this.uploadProvider === 'r2') {
        if (!this.s3Client || !this.r2Bucket) {
          throw new BadRequestException('R2 chưa được cấu hình đúng')
        }

        let key = publicIdOrUrl
        if (publicIdOrUrl.startsWith('http')) {
          if (!this.r2PublicUrl) {
            throw new BadRequestException('Thiếu R2_PUBLIC_URL để phân giải key')
          }
          key = publicIdOrUrl.replace(`${this.r2PublicUrl}/`, '')
        }

        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.r2Bucket,
            Key: key,
          }),
        )

        this.logger.log(`File deleted from R2: ${key}`)
        return { success: true }
      }

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
          const pathWithoutVersion = afterUpload[0].startsWith('v')
            ? afterUpload.slice(1)
            : afterUpload

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
