import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import * as streamifier from 'streamifier'

export interface CloudinaryResponse {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name)

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    })
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<CloudinaryResponse> {
    const uploadFolder =
      folder ?? this.configService.get<string>('CLOUDINARY_FOLDER') ?? 'uom-archive'

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: 'auto',
          transformation: [
            {
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Failed to upload file: ${error.message}`)
            return reject(error)
          }
          if (!result) {
            this.logger.error('Upload failed: No result returned from Cloudinary')
            return reject(new Error('Upload failed: No result returned'))
          }
          this.logger.log(`File uploaded successfully: ${result.public_id}`)
          resolve(result as CloudinaryResponse)
        },
      )

      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<CloudinaryResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder))
    return Promise.all(uploadPromises)
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId)
      this.logger.log(`File deleted successfully: ${publicId}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Failed to delete file: ${errorMessage}`)
      throw error
    }
  }

  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((publicId) => this.deleteFile(publicId))
    await Promise.all(deletePromises)
  }
}
