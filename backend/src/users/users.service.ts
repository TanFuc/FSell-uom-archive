import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ==================== FIND ALL ====================

  async findAll(query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      includeDeleted = false,
    } = query

    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null
    }

    // Search
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filters
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          creator: { select: { id: true, email: true, fullName: true } },
          updater: { select: { id: true, email: true, fullName: true } },
          deleter: { select: { id: true, email: true, fullName: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ==================== FIND BY ID ====================

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        creator: { select: { id: true, email: true, fullName: true } },
        updater: { select: { id: true, email: true, fullName: true } },
        deleter: { select: { id: true, email: true, fullName: true } },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`)
    }

    return user
  }

  // ==================== CREATE ====================

  async create(dto: CreateUserDto, creatorId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException(`User with email "${dto.email}" already exists`)
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        fullName: dto.fullName,
        role: dto.role,
        isActive: dto.isActive ?? true,
        createdBy: creatorId,
        updatedBy: creatorId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await this.invalidateUserCache()

    this.logger.log(`User created: ${user.email} by user ${creatorId}`)
    return user
  }

  // ==================== UPDATE ====================

  async update(id: string, dto: UpdateUserDto, updaterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`)
    }

    if (user.deletedAt) {
      throw new ForbiddenException('Cannot update a deleted user')
    }

    const updateData: any = {
      ...dto,
      updatedBy: updaterId,
    }

    // Hash new password if provided
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10)
      delete updateData.password
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    await this.redis.del(`user:${id}`)
    await this.invalidateUserCache()

    this.logger.log(`User updated: ${updatedUser.email} by user ${updaterId}`)
    return updatedUser
  }

  // ==================== SOFT DELETE ====================

  async softDelete(id: string, deleterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`)
    }

    if (user.deletedAt) {
      throw new ForbiddenException('User is already deleted')
    }

    // Prevent self-deletion
    if (user.id === deleterId) {
      throw new ForbiddenException('Cannot delete your own account')
    }

    const deleted = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deleterId,
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        deletedAt: true,
      },
    })

    await this.invalidateUserCache()

    this.logger.log(`User soft-deleted: ${deleted.email} by user ${deleterId}`)
    return { message: 'User deleted successfully', user: deleted }
  }

  // ==================== RESTORE ====================

  async restore(id: string, restorerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`)
    }

    if (!user.deletedAt) {
      throw new ForbiddenException('User is not deleted')
    }

    const restored = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedBy: restorerId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    })

    await this.invalidateUserCache()

    this.logger.log(`User restored: ${restored.email} by user ${restorerId}`)
    return restored
  }

  // ==================== HELPER METHODS ====================

  private async invalidateUserCache() {
    const keys = await this.redis.keys('users:*')
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)))
    }
  }
}
