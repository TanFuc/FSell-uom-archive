import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { CategoriesService } from './categories.service'

describe('CategoriesService', () => {
  let service: CategoriesService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn().mockResolvedValue([{ id: '1', nameVi: 'Gốm' }]),
              findUnique: jest.fn().mockResolvedValue({ id: '1', nameVi: 'Gốm' }),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<CategoriesService>(CategoriesService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  describe('findAll', () => {
    it('should return categories', async () => {
      const findManySpy = jest.spyOn(prisma.category, 'findMany')
      const result = await service.findAll(false, false)
      expect(result).toEqual([{ id: '1', nameVi: 'Gốm' }])
      expect(findManySpy).toHaveBeenCalled()
    })
  })
})
