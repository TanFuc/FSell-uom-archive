import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  BulkUpdateDto,
} from './dto'
import { createFlexibleSearchConditions } from '../common/utils/vietnamese-search.util'

const CACHE_TTL = 300 // 5 minutes

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ==================== FIND ALL WITH ADVANCED FILTERING ====================

  async findAll(query: QueryProductsDto, userRole?: Role) {
    const {
      page = 1,
      limit = 12,
      search,
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

    // Build dynamic where clause
    const where: Prisma.ProductWhereInput = {}

    // Soft delete filter - MANAGER can only see non-deleted items
    if (userRole === Role.MANAGER || !includeDeleted) {
      where.deletedAt = null
    }

    // Non-authenticated users only see active, non-deleted products
    if (!userRole) {
      where.isActive = true
      where.deletedAt = null
    }

    // Search across multiple fields with Vietnamese accent flexibility
    if (search) {
      where.OR = createFlexibleSearchConditions(search, [
        'nameVi',
        'nameEn', 
        'slug',
        'material',
        'descriptionVi',
        'descriptionEn'
      ])
    }

    // Filters
    if (isActive !== undefined) where.isActive = isActive
    if (inquiryEnabled !== undefined) where.inquiryEnabled = inquiryEnabled
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured
    if (createdBy) where.createdBy = createdBy

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.priceVND = {}
      if (minPrice !== undefined) where.priceVND.gte = minPrice
      if (maxPrice !== undefined) where.priceVND.lte = maxPrice
    }

    // Cache key includes all filters
    const cacheKey = `products:${JSON.stringify({ where, skip, limit, sortBy, sortOrder })}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
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
          relatedProducts: { 
            select: { 
              id: true, 
              nameVi: true, 
              nameEn: true, 
              slug: true, 
              images: true, 
              priceVND: true 
            } 
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

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL)

    return result
  }

  // ==================== FIND BY SLUG ====================

  async findBySlug(slug: string) {
    const cacheKey = `product:slug:${slug}`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        creator: { select: { id: true, email: true, fullName: true } },
        updater: { select: { id: true, email: true, fullName: true } },
        relatedProducts: true,
      },
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    if (product.deletedAt) {
      throw new NotFoundException('Product has been deleted')
    }

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(product), 3600)

    return product
  }

  // ==================== FIND BY ID ====================

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true, fullName: true } },
        updater: { select: { id: true, email: true, fullName: true } },
        deleter: { select: { id: true, email: true, fullName: true } },
        relatedProducts: true,
      },
    })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    return product
  }

  // ==================== CREATE ====================

  async create(dto: CreateProductDto, userId: string) {
    const { relatedProductIds, ...productData } = dto

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    })

    if (existingProduct) {
      throw new ConflictException(`Product with slug "${dto.slug}" already exists`)
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        createdBy: userId,
        updatedBy: userId,
        // Auto-generate inquiry messages if empty
        inquiryMessageVi: dto.inquiryMessageVi || this.generateDefaultMessage(dto, 'vi'),
        inquiryMessageEn: dto.inquiryMessageEn || this.generateDefaultMessage(dto, 'en'),
        relatedProducts: relatedProductIds 
          ? { connect: relatedProductIds.map((id) => ({ id })) } 
          : undefined,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Product created: ${product.slug} by user ${userId}`)
    return product
  }

  // ==================== UPDATE ====================

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const { relatedProductIds, ...updateData } = dto

    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    if (product.deletedAt) {
      throw new ForbiddenException('Cannot update a deleted product')
    }

    // Check if slug is being updated and already exists
    if (dto.slug && dto.slug !== product.slug) {
      const existingSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      })

      if (existingSlug) {
        throw new ConflictException(`Product with slug "${dto.slug}" already exists`)
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
        relatedProducts: relatedProductIds 
          ? { set: relatedProductIds.map((id) => ({ id })) } 
          : undefined,
      },
    })

    // Invalidate caches
    await this.redis.del(`product:${id}`)
    await this.redis.del(`product:slug:${product.slug}`)
    await this.invalidateProductCache()

    this.logger.log(`Product updated: ${updatedProduct.slug} by user ${userId}`)
    return updatedProduct
  }

  // ==================== SOFT DELETE ====================

  async softDelete(id: string, userId: string, userRole: Role) {
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

  // ==================== HARD DELETE (ADMIN ONLY) ====================

  async hardDelete(id: string, userRole: Role) {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only ADMIN can permanently delete products')
    }

    const product = await this.prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`)
    }

    await this.prisma.product.delete({ where: { id } })
    await this.invalidateProductCache(id)

    this.logger.log(`Product hard-deleted: ${product.slug}`)
    return { message: 'Product permanently deleted' }
  }

  // ==================== RESTORE (ADMIN ONLY) ====================

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

  // ==================== DUPLICATE ====================

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.product.findUnique({ where: { id } })

    if (!original || original.deletedAt) {
      throw new NotFoundException('Product not found')
    }

    // Generate unique slug
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
        images: original.images,
        material: original.material,
        dimensions: original.dimensions,
        stock: original.stock,
        isActive: false, // Start as inactive
        inquiryEnabled: original.inquiryEnabled,
        inquiryMessageVi: original.inquiryMessageVi,
        inquiryMessageEn: original.inquiryMessageEn,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    await this.invalidateProductCache()

    this.logger.log(`Product duplicated: ${original.slug} -> ${duplicated.slug} by user ${userId}`)
    return duplicated
  }

  // ==================== BULK SOFT DELETE ====================

  async bulkSoftDelete(ids: string[], userId: string, userRole: Role) {
    // Validate all products exist and not deleted
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

  // ==================== BULK UPDATE ====================

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

  // ==================== BULK RESTORE (ADMIN ONLY) ====================

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

  // ==================== HELPER METHODS ====================

  private generateDefaultMessage(
    dto: CreateProductDto | any,
    language: 'vi' | 'en',
  ): string {
    if (language === 'vi') {
      return `Xin chào! Tôi quan tâm đến sản phẩm "${dto.nameVi}".

Thông tin sản phẩm:
- Giá: ${dto.priceVND.toLocaleString('vi-VN')}₫
- Chất liệu: ${dto.material}
- Kích thước: ${dto.dimensions}

Bạn có thể cho tôi biết thêm chi tiết không?`
    } else {
      const priceUSD = Math.round(dto.priceVND / 25000)
      return `Hello! I'm interested in the "${dto.nameEn}".

Product details:
- Price: ${dto.priceVND.toLocaleString('vi-VN')}₫ (~$${priceUSD})
- Material: ${dto.material}
- Dimensions: ${dto.dimensions}

Could you provide more information?`
    }
  }

  private async invalidateProductCache(productId?: string) {
    // Invalidate list caches (all pages, filters)
    const keys = await this.redis.keys('products:*')
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)))
    }

    // Invalidate specific product cache if ID provided
    if (productId) {
      await this.redis.del(`product:${productId}`)
    }
  }
}
