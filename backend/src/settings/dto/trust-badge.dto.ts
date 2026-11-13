import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateTrustBadgeDto {
  @ApiProperty({ description: 'Icon identifier (package, sparkles, shield, truck, check, heart, award, refresh)', default: 'package' })
  @IsString()
  @IsNotEmpty()
  icon: string

  @ApiProperty({ description: 'Vietnamese title' })
  @IsString()
  @IsNotEmpty()
  titleVi: string

  @ApiProperty({ description: 'English title' })
  @IsString()
  @IsNotEmpty()
  titleEn: string

  @ApiPropertyOptional({ description: 'Vietnamese description' })
  @IsString()
  @IsOptional()
  descriptionVi?: string

  @ApiPropertyOptional({ description: 'English description' })
  @IsString()
  @IsOptional()
  descriptionEn?: string

  @ApiPropertyOptional({ description: 'Visibility flag', default: true })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsInt()
  @IsOptional()
  order?: number
}

export class UpdateTrustBadgeDto {
  @ApiPropertyOptional({ description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: 'Vietnamese title' })
  @IsString()
  @IsOptional()
  titleVi?: string

  @ApiPropertyOptional({ description: 'English title' })
  @IsString()
  @IsOptional()
  titleEn?: string

  @ApiPropertyOptional({ description: 'Vietnamese description' })
  @IsString()
  @IsOptional()
  descriptionVi?: string

  @ApiPropertyOptional({ description: 'English description' })
  @IsString()
  @IsOptional()
  descriptionEn?: string

  @ApiPropertyOptional({ description: 'Visibility flag' })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean

  @ApiPropertyOptional({ description: 'Display order' })
  @IsInt()
  @IsOptional()
  order?: number
}

export class ToggleTrustBadgesGlobalDto {
  @ApiProperty({ description: 'Global display toggle for trust badges' })
  @IsBoolean()
  enabled: boolean
}
