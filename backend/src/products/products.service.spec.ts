import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Product } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { ProductsService } from './products.service'

type FindUniqueResult = Awaited<ReturnType<PrismaService['product']['findUnique']>>

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: PrismaService
  let redis: RedisService

  const mockProduct: Product = {
    id: '123',
    slug: 'test-product',
    nameVi: 'Sản phẩm test',
    nameEn: 'Test product',
    shortDescriptionVi: '',
    shortDescriptionEn: '',
    descriptionVi: 'Mô tả test',
    descriptionEn: 'Test description',
    categoryId: null,
    priceVND: 100000,
    priceUSD: 5,
    salePriceVND: null,
    salePriceUSD: null,
    images: [],
    hoverImage: null,
    material: 'Ceramic',
    dimensions: '10x10x10',
    stock: 10,
    isActive: true,
    isFeatured: false,
    inquiryEnabled: true,
    inquiryMessageVi: '',
    inquiryMessageEn: '',
    createdAt: new Date(),
    createdBy: null,
    updatedAt: new Date(),
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    hardDeletedAt: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            clearCacheMatch: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
    prisma = module.get<PrismaService>(PrismaService)
    redis = module.get<RedisService>(RedisService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findBySlug', () => {
    it('should return from cache if exists', async () => {
      const redisGetSpy = jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockProduct))
      const findUniqueSpy = jest.spyOn(prisma.product, 'findUnique')

      const result = (await service.findBySlug('test-product')) as Product

      expect(redisGetSpy).toHaveBeenCalledWith('product:slug:test-product')
      expect(findUniqueSpy).not.toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should query DB and save to cache if not in cache', async () => {
      const productRecord = mockProduct as unknown as NonNullable<FindUniqueResult>
      const redisGetSpy = jest.spyOn(redis, 'get').mockResolvedValue(null)
      const findUniqueSpy = jest
        .spyOn(prisma.product, 'findUnique')
        .mockResolvedValue(productRecord)
      const redisSetSpy = jest.spyOn(redis, 'set').mockResolvedValue()

      const result = (await service.findBySlug('test-product')) as Product

      expect(redisGetSpy).toHaveBeenCalledWith('product:slug:test-product')
      expect(findUniqueSpy).toHaveBeenCalled()
      expect(redisSetSpy).toHaveBeenCalledWith(
        'product:slug:test-product',
        JSON.stringify(mockProduct),
        3600,
      )
      expect(result).toEqual(mockProduct)
    })

    it('should throw NotFoundException if product does not exist in DB', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue(null)
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException if product is deleted', async () => {
      const deletedProduct = {
        ...mockProduct,
        deletedAt: new Date(),
      } as unknown as NonNullable<FindUniqueResult>
      jest.spyOn(redis, 'get').mockResolvedValue(null)
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(deletedProduct)

      await expect(service.findBySlug('test-product')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('should return product if valid ID', async () => {
      const productRecord = mockProduct as unknown as NonNullable<FindUniqueResult>
      const findUniqueSpy = jest
        .spyOn(prisma.product, 'findUnique')
        .mockResolvedValue(productRecord)

      const result = (await service.findById('123')) as Product

      expect(findUniqueSpy).toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should throw NotFoundException if product not found by ID', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)

      await expect(service.findById('999')).rejects.toThrow(NotFoundException)
    })
  })
})
