import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator'

export class BulkDeleteDto {
  @ApiProperty({
    example: ['id1', 'id2', 'id3'],
    description: 'Array of product IDs to delete',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[]
}

export class BulkUpdateDto {
  @ApiProperty({
    example: ['id1', 'id2', 'id3'],
    description: 'Array of product IDs to update',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[]

  @ApiPropertyOptional({
    example: true,
    description: 'Set active status for all selected products',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    example: true,
    description: 'Enable/disable inquiry for all selected products',
  })
  @IsOptional()
  @IsBoolean()
  inquiryEnabled?: boolean
}

export class BulkRestoreDto {
  @ApiProperty({
    example: ['id1', 'id2', 'id3'],
    description: 'Array of product IDs to restore',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[]
}
