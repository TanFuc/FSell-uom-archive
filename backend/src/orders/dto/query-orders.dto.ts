import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ORDER_STATUSES, OrderStatus } from './update-order-status.dto'

export class QueryOrdersDto {
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
    example: 20,
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20

  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    example: 'pending',
    description: 'Filter by status',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Filter by customer email',
  })
  @IsOptional()
  @IsString()
  email?: string
}
