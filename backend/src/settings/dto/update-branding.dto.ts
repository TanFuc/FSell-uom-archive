import { IsString, IsOptional, IsUrl } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: 'ƯƠM. Archive' })
  @IsString()
  @IsOptional()
  brandNameVi?: string

  @ApiPropertyOptional({ example: 'ƯƠM. Archive' })
  @IsString()
  @IsOptional()
  brandNameEn?: string

  @ApiPropertyOptional({ example: 'Gốm sứ thủ công Việt Nam' })
  @IsString()
  @IsOptional()
  brandTaglineVi?: string

  @ApiPropertyOptional({ example: 'Handcrafted Ceramics from Vietnam' })
  @IsString()
  @IsOptional()
  brandTaglineEn?: string

  @ApiPropertyOptional({ example: 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam' })
  @IsString()
  @IsOptional()
  siteTitleVi?: string

  @ApiPropertyOptional({ example: 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam' })
  @IsString()
  @IsOptional()
  siteTitleEn?: string

  @ApiPropertyOptional({ example: 'Discover timeless Vietnamese ceramics curated with care.' })
  @IsString()
  @IsOptional()
  siteDescriptionVi?: string

  @ApiPropertyOptional({ example: 'Discover timeless Vietnamese ceramics curated with care.' })
  @IsString()
  @IsOptional()
  siteDescriptionEn?: string

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/example/image/upload/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string

  @ApiPropertyOptional({ example: 'ƯƠM.' })
  @IsString()
  @IsOptional()
  loadingText?: string
}
