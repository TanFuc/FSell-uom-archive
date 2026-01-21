import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBannerDto: CreateBannerDto, userId?: string) {
    return this.prisma.banner.create({
      data: {
        ...createBannerDto,
        createdBy: userId,
      },
    });
  }

  findAll(activeOnly: boolean = false) {
    return this.prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { order: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: { id },
    });
  }

  update(id: string, updateBannerDto: UpdateBannerDto, userId?: string) {
    return this.prisma.banner.update({
      where: { id },
      data: {
        ...updateBannerDto,
        updatedBy: userId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
