import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../prisma/prisma.service'
import { SapoService } from './sapo.service'
import { UploadService } from '../upload/upload.service'

@Injectable()
export class SapoSyncService {
  private readonly logger = new Logger(SapoSyncService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly sapoService: SapoService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Đồng bộ một mảng product IDs được chọn từ Sapo
   * Try/catch độc lập cho từng item để đảm bảo không bị dừng cả luồng nếu 1 sản phẩm bị lỗi
   */
  async syncSelectedProducts(sapoProductIds: (string | number)[], userId?: string) {
    const results = []

    for (const sapoId of sapoProductIds) {
      try {
        const itemResult = await this.syncSingleProduct(String(sapoId), userId)
        results.push({
          sapoId: String(sapoId),
          status: 'success',
          product: itemResult,
        })
      } catch (err: any) {
        this.logger.error(`Đồng bộ thất bại cho sản phẩm Sapo ID ${sapoId}: ${err.message}`)
        results.push({
          sapoId: String(sapoId),
          status: 'failed',
          error: err.message,
        })
      }
    }

    return results
  }

  /**
   * Đồng bộ 1 sản phẩm cụ thể:
   * 1. Kéo chi tiết từ Sapo qua GET /admin/products/{id}.json
   * 2. Tải toàn bộ ảnh từ CDN Sapo về và re-upload vào storage nội bộ (R2/Cloudinary)
   * 3. Đối chiếu DB: Insert mới hoặc Update
   */
  async syncSingleProduct(sapoProductId: string, userId?: string) {
    const sapoProduct = await this.sapoService.getProductDetail(sapoProductId)
    if (!sapoProduct) {
      throw new Error(`Không tìm thấy sản phẩm trên Sapo với ID ${sapoProductId}`)
    }

    const firstVariant = sapoProduct.variants?.[0] || {}
    const sku = firstVariant.sku ? String(firstVariant.sku).trim() : `SAPO-${sapoProductId}`
    const priceVND = Math.round(Number(firstVariant.price || 0))
    const stock = Number(firstVariant.inventory_quantity || 0)

    // 1. Tải ảnh từ Sapo và Upload lên hệ thống lưu trữ nội bộ
    const internalImageUrls: string[] = []
    if (Array.isArray(sapoProduct.images) && sapoProduct.images.length > 0) {
      for (const img of sapoProduct.images) {
        if (!img.src) continue
        try {
          const imgResponse = await axios.get(img.src, {
            responseType: 'arraybuffer',
            timeout: 10000,
          })
          const buffer = Buffer.from(imgResponse.data)
          const uploadRes = await this.uploadService.uploadImageFromBuffer(buffer, 'products')
          internalImageUrls.push(uploadRes.url)
        } catch (uploadErr: any) {
          this.logger.warn(`Không thể tải/upload ảnh cho sản phẩm ${sapoProductId}: ${uploadErr.message}`)
        }
      }
    }

    // 2. Đối chiếu DB: Tìm theo sapoProductId hoặc SKU
    const existing = await this.prisma.product.findFirst({
      where: {
        OR: [{ sapoProductId: String(sapoProductId) }, { sku }],
        deletedAt: null,
      },
    })

    const name = sapoProduct.name || 'Sản phẩm Sapo'
    const slug = sapoProduct.alias
      ? `${sapoProduct.alias}-${Date.now().toString().slice(-4)}`
      : `sp-${sapoProductId}-${Date.now().toString().slice(-4)}`
    const description = sapoProduct.content || ''

    if (!existing) {
      // INSERT MỚI
      const newProduct = await this.prisma.product.create({
        data: {
          slug,
          nameVi: name,
          nameEn: name,
          descriptionVi: description,
          descriptionEn: description,
          sku,
          sapoProductId: String(sapoProductId),
          priceVND,
          stock,
          images: internalImageUrls.length > 0 ? internalImageUrls : [],
          hoverImage: internalImageUrls[1] || null,
          isActive: true,
          createdBy: userId || null,
        },
      })
      this.logger.log(`Tạo mới sản phẩm từ Sapo thành công: ${newProduct.nameVi} (SKU: ${sku})`)
      return newProduct
    } else {
      // UPDATE SẢN PHẨM HIỆN TẠI
      const updatedProduct = await this.prisma.product.update({
        where: { id: existing.id },
        data: {
          nameVi: name,
          sku,
          sapoProductId: String(sapoProductId),
          priceVND,
          stock,
          images: internalImageUrls.length > 0 ? internalImageUrls : (existing.images as any),
          hoverImage: internalImageUrls[1] || existing.hoverImage,
          updatedBy: userId || null,
        },
      })
      this.logger.log(`Cập nhật sản phẩm từ Sapo thành công: ${updatedProduct.nameVi} (SKU: ${sku})`)
      return updatedProduct
    }
  }
}
