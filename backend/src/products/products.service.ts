import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { createFlexibleSearchConditions } from '../common/utils/vietnamese-search.util'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { CreateProductDto, UpdateProductDto, QueryProductsDto, BulkUpdateDto } from './dto'

const CACHE_TTL = 300 // 5 minutes

type ProductListResult = {
  data: unknown[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    creator: { select: { id: true; email: true; fullName: true } }
    updater: { select: { id: true; email: true; fullName: true } }
    category: { select: { id: true; nameVi: true; nameEn: true; slug: true } }
    relatedProducts: true
  }
}>

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private parseCachedJson<T>(cached: string): T | null {
    try {
      return JSON.parse(cached) as T
    } catch {
      return null
    }
  }

  async findAll(query: QueryProductsDto, userRole?: Role) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      isActive,
      inquiryEnabled,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdBy,
      minPrice,
      maxPrice,
    } = query

    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      hardDeletedAt: null, // Always exclude hard-deleted items
    }

    if (userRole === Role.MANAGER || !includeDeleted) {
      where.deletedAt = null
    }

    if (!userRole) {
      where.isActive = true
      where.deletedAt = null
    }

    if (search) {
      where.OR = createFlexibleSearchConditions(search, [
        'nameVi',
        'nameEn',
        'slug',
        'material',
        'descriptionVi',
        'descriptionEn',
      ])
    }

    if (categoryId) where.categoryId = categoryId
    if (isActive !== undefined) where.isActive = isActive
    if (inquiryEnabled !== undefined) where.inquiryEnabled = inquiryEnabled
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured
    if (createdBy) where.createdBy = createdBy

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceVND = {}
      if (minPrice !== undefined) where.priceVND.gte = minPrice
      if (maxPrice !== undefined) where.priceVND.lte = maxPrice
    }

    const cacheKey = `products:${JSON.stringify({ where, skip, limit, sortBy, sortOrder })}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      const parsed = this.parseCachedJson<ProductListResult>(cached)
      if (parsed) return parsed
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, email: true, fullName: true } },
          updater: { select: { id: true, email: true, fullName: true } },
          deleter: { select: { id: true, email: true, fullName: true } },
          category: { select: { id: true, nameVi: true, nameEn: true, slug: true } },
          relatedProducts: {
            select: {
              id: true,
              nameVi: true,
              nameEn: true,
              slug: true,
              images: true,
              priceVND: true,
              priceUSD: true,
              salePriceVND: true,
              salePriceUSD: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    const result = {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL)

    return result
  }

  async getStats() {
    const [totalProducts, activeProducts, featuredProducts] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.product.count({ where: { deletedAt: null, isFeatured: true } }),
    ])

    return {
      totalProducts,
      activeProducts,
      featuredProducts,
    }
  }

  async findBySlug(slug: string) {
    const cacheKey = `product:slug:${slug}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      const parsed = this.parseCachedJson<ProductWithRelations>(cached)
      if (parsed) return parsed
    }

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        creator: { select: { id: true, email: true, fullName: true } },
        updater: { select: { id: true, email: true, fullName: true } },
        category: { select: { id: true, nameVi: true, nameEn: true, slug: true } },
        relatedProducts: true,
      },
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    if (product.deletedAt) {
      throw new NotFoundException('Product has been deleted')
    }

    await this.redis.set(cacheKey, JSON.stringify(product), 3600)

    return product
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true, fullName: true } },
        updater: { select: { id: true, email: true, fullName: true } },
        deleter: { select: { id: true, email: true, fullName: true } },
        category: { select: { id: true, nameVi: true, nameEn: true, slug: true } },
        relatedProducts: true,
      },
    })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    return product
  }

  async create(dto: CreateProductDto, userId: string) {
    const { relatedProductIds, ...productData } = dto
    const exchangeRate = await this.getCurrentExchangeRate()

    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    })

    if (existingProduct) {
      throw new ConflictException(`Product with slug "${dto.slug}" already exists`)
    }

    const priceData = this.preparePriceData(dto, exchangeRate)

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        ...priceData,
        createdBy: userId,
        updatedBy: userId,

        inquiryMessageVi:
          dto.inquiryMessageVi ??
          this.generateDefaultMessage(dto, 'vi', exchangeRate, priceData.priceUSD),
        inquiryMessageEn:
          dto.inquiryMessageEn ??
          this.generateDefaultMessage(dto, 'en', exchangeRate, priceData.priceUSD),
        relatedProducts: relatedProductIds
          ? { connect: relatedProductIds.map((id) => ({ id })) }
          : undefined,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Product created: ${product.slug} by user ${userId}`)
    return product
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const { relatedProductIds, ...updateData } = dto
    const exchangeRate = await this.getCurrentExchangeRate()

    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    if (product.deletedAt) {
      throw new ForbiddenException('Cannot update a deleted product')
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      })

      if (existingSlug) {
        throw new ConflictException(`Product with slug "${dto.slug}" already exists`)
      }
    }

    const priceData = this.preparePriceData(dto, exchangeRate)

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...priceData,
        updatedBy: userId,
        relatedProducts: relatedProductIds
          ? { set: relatedProductIds.map((id) => ({ id })) }
          : undefined,
      },
    })

    await this.redis.del(`product:${id}`)
    await this.redis.del(`product:slug:${product.slug}`)
    await this.invalidateProductCache()

    this.logger.log(`Product updated: ${updatedProduct.slug} by user ${userId}`)
    return updatedProduct
  }

  async softDelete(id: string, userId: string, _userRole: Role) {
    const product = await this.prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    if (product.deletedAt) {
      throw new ForbiddenException('Product is already deleted')
    }

    const deleted = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    })

    await this.invalidateProductCache(id)

    this.logger.log(`Product soft-deleted: ${deleted.slug} by user ${userId}`)
    return { message: 'Product deleted successfully', product: deleted }
  }

  async hardDelete(id: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can permanently delete products')
    }

    const product = await this.prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    const timestamp = new Date().getTime()
    await this.prisma.product.update({
      where: { id },
      data: {
        hardDeletedAt: new Date(),
        slug: `${product.slug}-deleted-${timestamp}`, // Free up the slug
        deletedAt: product.deletedAt ?? new Date(), // Ensure it's marked as soft deleted too
        isActive: false,
      },
    })

    await this.invalidateProductCache(id)

    this.logger.log(`Product hard-deleted (archived): ${product.slug}`)
    return { message: 'Product permanently deleted' }
  }

  async restore(id: string, userId: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can restore deleted products')
    }

    const product = await this.prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    if (!product.deletedAt) {
      throw new ForbiddenException('Product is not deleted')
    }

    const restored = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Product restored: ${restored.slug} by user ${userId}`)
    return restored
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.product.findUnique({ where: { id } })

    if (!original || original.deletedAt) {
      throw new NotFoundException('Product not found')
    }

    const baseSlug = original.slug
    let newSlug = `${baseSlug}-copy`
    let counter = 1

    while (await this.prisma.product.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${baseSlug}-copy-${counter}`
      counter++
    }

    const duplicated = await this.prisma.product.create({
      data: {
        slug: newSlug,
        nameVi: `${original.nameVi} (Copy)`,
        nameEn: `${original.nameEn} (Copy)`,
        descriptionVi: original.descriptionVi,
        descriptionEn: original.descriptionEn,
        priceVND: original.priceVND,
        priceUSD: original.priceUSD,
        salePriceVND: original.salePriceVND,
        salePriceUSD: original.salePriceUSD,
        images: original.images,
        hoverImage: original.hoverImage,
        material: original.material,
        dimensions: original.dimensions,
        stock: original.stock,
        isActive: false, // Start as inactive
        isFeatured: false, // Don't copy featured status
        inquiryEnabled: original.inquiryEnabled,
        inquiryMessageVi: original.inquiryMessageVi,
        inquiryMessageEn: original.inquiryMessageEn,
        categoryId: original.categoryId,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Product duplicated: ${original.slug} -> ${duplicated.slug} by user ${userId}`)
    return duplicated
  }

  async bulkSoftDelete(ids: string[], userId: string, _userRole: Role) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
    })

    if (products.length !== ids.length) {
      throw new BadRequestException('Some products not found or already deleted')
    }

    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Bulk soft delete: ${ids.length} products by user ${userId}`)
    return { deleted: ids.length }
  }

  async bulkUpdate(dto: BulkUpdateDto, userId: string) {
    const { ids, ...updateData } = dto

    const result = await this.prisma.product.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null, // Only update non-deleted
      },
      data: {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Bulk update: ${result.count} products by user ${userId}`)
    return { updated: result.count }
  }

  async bulkRestore(ids: string[], userId: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can restore products')
    }

    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Bulk restore: ${result.count} products by user ${userId}`)
    return { restored: result.count }
  }

  /**
   * Convert VND to USD using exchange rate
   */
  private convertVndToUsd(vnd: number, exchangeRate: number): number {
    return Math.round((vnd / exchangeRate) * 100) / 100
  }

  private async getCurrentExchangeRate(): Promise<number> {
    const cached = await this.redis.get('exchange_rate')
    if (cached) {
      const parsed = parseFloat(cached)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }

    const setting = await this.prisma.siteSettings.findUnique({
      where: { key: 'exchange_rate' },
    })

    const parsed = setting ? parseFloat(setting.value) : NaN
    const rate = !Number.isNaN(parsed) && parsed > 0 ? parsed : 25000

    await this.redis.set('exchange_rate', rate.toString(), 3600)
    return rate
  }

  /**
   * Prepare price data with auto-conversion
   */
  private preparePriceData(
    dto: CreateProductDto | UpdateProductDto,
    exchangeRate: number,
  ): {
    priceUSD?: number
    salePriceUSD?: number | null
  } {
    const result: { priceUSD?: number; salePriceUSD?: number | null } = {}

    if (dto.priceVND !== undefined && dto.priceUSD === undefined) {
      result.priceUSD = this.convertVndToUsd(dto.priceVND, exchangeRate)
    } else if (dto.priceUSD !== undefined) {
      result.priceUSD = dto.priceUSD
    }

    if (dto.salePriceVND !== undefined) {
      if (dto.salePriceUSD === undefined && dto.salePriceVND !== null) {
        result.salePriceUSD = this.convertVndToUsd(dto.salePriceVND, exchangeRate)
      } else {
        result.salePriceUSD = dto.salePriceUSD
      }
    }

    return result
  }

  private generateDefaultMessage(
    dto: CreateProductDto,
    language: 'vi' | 'en',
    exchangeRate: number,
    computedPriceUSD?: number,
  ): string {
    if (language === 'vi') {
      return `Xin chào! Tôi quan tâm đến sản phẩm "${dto.nameVi}".

Thông tin sản phẩm:
- Giá: ${dto.priceVND.toLocaleString('vi-VN')}₫
- Chất liệu: ${dto.material}
- Kích thước: ${dto.dimensions}

Bạn có thể cho tôi biết thêm chi tiết không?`
    } else {
      const priceUSD = computedPriceUSD ?? this.convertVndToUsd(dto.priceVND, exchangeRate)
      return `Hello! I'm interested in the "${dto.nameEn}".

Product details:
- Price: ${dto.priceVND.toLocaleString('vi-VN')}₫ (~$${priceUSD})
- Material: ${dto.material}
- Dimensions: ${dto.dimensions}

Could you provide more information?`
    }
  }

  private async invalidateProductCache(productId?: string) {
    const keys = await this.redis.keys('products:*')
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)))
    }

    if (productId) {
      await this.redis.del(`product:${productId}`)
    }
  }
}
