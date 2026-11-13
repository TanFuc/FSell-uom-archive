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
   * Chuẩn hóa URL ảnh Sapo: Thêm https: nếu là protocol-relative (//bizweb.dktcdn.net/...)
   */
  private normalizeSapoImageUrl(rawUrl: any): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null
    let trimmed = rawUrl.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('//')) {
      trimmed = `https:${trimmed}`
    } else if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`
    }
    return trimmed
  }

  /**
   * Trích xuất tất cả URL ảnh của sản phẩm từ Sapo (từ mảng images, thuộc tính image, và các biến thể)
   */
  private extractAllSapoImageUrls(sapoProduct: any): string[] {
    const urls: string[] = []

    // 1. Mảng images
    if (Array.isArray(sapoProduct.images)) {
      for (const item of sapoProduct.images) {
        if (typeof item === 'string') {
          const u = this.normalizeSapoImageUrl(item)
          if (u) urls.push(u)
        } else if (item && typeof item === 'object') {
          const u = this.normalizeSapoImageUrl(item.src || item.url || item.full_path)
          if (u) urls.push(u)
        }
      }
    }

    // 2. Thuộc tính image đơn lẻ
    if (sapoProduct.image) {
      if (typeof sapoProduct.image === 'string') {
        const u = this.normalizeSapoImageUrl(sapoProduct.image)
        if (u) urls.push(u)
      } else if (typeof sapoProduct.image === 'object') {
        const u = this.normalizeSapoImageUrl(sapoProduct.image.src || sapoProduct.image.url)
        if (u) urls.push(u)
      }
    }

    // 3. Ảnh từ các biến thể (variants)
    if (Array.isArray(sapoProduct.variants)) {
      for (const v of sapoProduct.variants) {
        if (v.image) {
          if (typeof v.image === 'string') {
            const u = this.normalizeSapoImageUrl(v.image)
            if (u) urls.push(u)
          } else if (typeof v.image === 'object') {
            const u = this.normalizeSapoImageUrl(v.image.src || v.image.url)
            if (u) urls.push(u)
          }
        }
      }
    }

    // Khử trùng lặp URL và giữ nguyên thứ tự
    return Array.from(new Set(urls))
  }

  /**
   * Đồng bộ 1 sản phẩm cụ thể:
   * 1. Kéo chi tiết từ Sapo qua GET /admin/products/{id}.json
   * 2. Tải toàn bộ ảnh từ CDN Sapo về và re-upload vào storage nội bộ (R2 / Local fallback)
   * 3. Nếu tải/upload lỗi, luôn fallback giữ link gốc CDN Sapo để đảm bảo hình ảnh không bị mất
   * 4. Đối chiếu DB: Insert mới hoặc Update
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

    // 1. Tải ảnh từ Sapo và Upload lên hệ thống lưu trữ nội bộ (hoặc fallback Sapo CDN)
    const sapoImageUrls = this.extractAllSapoImageUrls(sapoProduct)
    const finalImageUrls: string[] = []

    for (const imgUrl of sapoImageUrls) {
      try {
        const imgResponse = await axios.get(imgUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        })
        const buffer = Buffer.from(imgResponse.data)
        const uploadRes = await this.uploadService.uploadImageFromBuffer(buffer, 'products')
        if (uploadRes?.url) {
          finalImageUrls.push(uploadRes.url)
        } else {
          finalImageUrls.push(imgUrl)
        }
      } catch (uploadErr: any) {
        this.logger.warn(
          `Không thể tải/upload ảnh cho sản phẩm ${sapoProductId} (${imgUrl}): ${uploadErr.message}. Sử dụng trực tiếp CDN Sapo.`,
        )
        // Fallback trực tiếp URL Sapo để đảm bảo sản phẩm luôn có hình ảnh hiển thị
        finalImageUrls.push(imgUrl)
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
          images: finalImageUrls,
          hoverImage: finalImageUrls[1] || finalImageUrls[0] || null,
          isActive: true,
          createdBy: userId || null,
        },
      })
      this.logger.log(`Tạo mới sản phẩm từ Sapo thành công: ${newProduct.nameVi} (SKU: ${sku}, Ảnh: ${finalImageUrls.length})`)
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
          images: finalImageUrls.length > 0 ? finalImageUrls : (existing.images as any),
          hoverImage: finalImageUrls[1] || finalImageUrls[0] || existing.hoverImage,
          updatedBy: userId || null,
        },
      })
      this.logger.log(`Cập nhật sản phẩm từ Sapo thành công: ${updatedProduct.nameVi} (SKU: ${sku}, Ảnh: ${finalImageUrls.length})`)
      return updatedProduct
    }
  }
}
