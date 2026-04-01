import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { ProductsService } from './products.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: PrismaService
  let redis: RedisService

  const mockProduct = {
    id: '123',
    slug: 'test-product',
    nameVi: 'Sản phẩm test',
    nameEn: 'Test product',
    priceVND: 100000,
    priceUSD: 5,
    isActive: true,
    deletedAt: null,
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
      jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockProduct))

      const result = await service.findBySlug('test-product')

      expect(redis.get).toHaveBeenCalledWith('product:slug:test-product')
      expect(prisma.product.findUnique).not.toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should query DB and save to cache if not in cache', async () => {
      jest.spyOn(redis, 'get').mockResolvedValue(null)
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct as any)
      jest.spyOn(redis, 'set').mockResolvedValue(true as any)

      const result = await service.findBySlug('test-product')

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
        include: expect.any(Object),
      })
      expect(redis.set).toHaveBeenCalledWith(
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
      const deletedProduct = { ...mockProduct, deletedAt: new Date() }
      jest.spyOn(redis, 'get').mockResolvedValue(null)
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(deletedProduct as any)

      await expect(service.findBySlug('test-product')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('should return product if valid ID', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct as any)

      const result = await service.findById('123')

      expect(prisma.product.findUnique).toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should throw NotFoundException if product not found by ID', async () => {
      jest.spyOn(prisma.product, 'findUnique').mockResolvedValue(null)

      await expect(service.findById('999')).rejects.toThrow(NotFoundException)
    })
  })
})
