import { IsOptional, IsInt, Min, IsString, IsBoolean, IsEnum } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME_VI = 'nameVi',
  NAME_EN = 'nameEn',
  PRICE = 'priceVND',
}

export class QueryProductsDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    example: 12,
    description: 'Number of items per page',
    default: 12,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12

  @ApiPropertyOptional({
    example: 'vase',
    description: 'Search term for product name, slug, or material',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    example: 'category-id',
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status (admin only)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by inquiry enabled status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inquiryEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by featured status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean

  @ApiPropertyOptional({
    example: false,
    description: 'Include soft-deleted products (ADMIN only)',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean

  @ApiPropertyOptional({
    enum: SortField,
    example: SortField.CREATED_AT,
    description: 'Field to sort by',
    default: SortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField = SortField.CREATED_AT

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.DESC,
    description: 'Sort order',
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC

  @ApiPropertyOptional({
    example: 'user-id',
    description: 'Filter by creator user ID',
  })
  @IsOptional()
  @IsString()
  createdBy?: string

  @ApiPropertyOptional({
    example: 100000,
    description: 'Minimum price filter',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Maximum price filter',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number
}
