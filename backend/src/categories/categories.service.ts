import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId?: string) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })
  }

  async findAll(includeDeleted = false, includeInactive = false) {
    return this.prisma.category.findMany({
      where: {
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    return category
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with slug ${slug} not found`)
    }

    return category
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId?: string) {
    await this.findOne(id)

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        updatedBy: userId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id)

    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    })
  }

  async restore(id: string, userId?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    })

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedBy: userId,
      },
    })
  }

  async permanentDelete(id: string) {
    await this.findOne(id)

    return this.prisma.category.delete({
      where: { id },
    })
  }
}
