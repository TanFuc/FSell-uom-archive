import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class UpdateSiteContentDto {
  @ApiPropertyOptional({ example: 'SẢN PHẨM' })
  @IsString()
  @IsOptional()
  'menu.shop.vi'?: string

  @ApiPropertyOptional({ example: 'SHOP' })
  @IsString()
  @IsOptional()
  'menu.shop.en'?: string

  @ApiPropertyOptional({ example: 'GIỎ HÀNG' })
  @IsString()
  @IsOptional()
  'menu.cart.vi'?: string

  @ApiPropertyOptional({ example: 'CART' })
  @IsString()
  @IsOptional()
  'menu.cart.en'?: string

  @ApiPropertyOptional({ example: 'VẬN CHUYỂN & ĐỔI TRẢ' })
  @IsString()
  @IsOptional()
  'menu.shipping.vi'?: string

  @ApiPropertyOptional({ example: 'SHIPPING & RETURNS' })
  @IsString()
  @IsOptional()
  'menu.shipping.en'?: string

  @ApiPropertyOptional({ example: 'ƯƠM. Archive' })
  @IsString()
  @IsOptional()
  'brand.name.vi'?: string

  @ApiPropertyOptional({ example: 'ƯƠM. Archive' })
  @IsString()
  @IsOptional()
  'brand.name.en'?: string

  @ApiPropertyOptional({ example: '© 2026 ƯƠM. Archive. Tất cả quyền được bảo lưu.' })
  @IsString()
  @IsOptional()
  'footer.text.vi'?: string

  @ApiPropertyOptional({ example: '© 2026 ƯƠM. Archive. All rights reserved.' })
  @IsString()
  @IsOptional()
  'footer.text.en'?: string

  @ApiPropertyOptional({
    description: 'Serialized JSON array of trending search terms for Vietnamese locale',
    example: '["binh gom","chen tra","men ran"]',
  })
  @IsString()
  @IsOptional()
  'search.trending.vi'?: string

  @ApiPropertyOptional({
    description: 'Serialized JSON array of trending search terms for English locale',
    example: '["ceramic vase","tea cup","crackle glaze"]',
  })
  @IsString()
  @IsOptional()
  'search.trending.en'?: string

  @ApiPropertyOptional({
    description: 'Serialized JSON stories payload for journal section',
    example:
      '[{"id":"story-1","titleVi":"...","titleEn":"...","summaryVi":"...","summaryEn":"...","contentVi":"...","contentEn":"...","imageUrl":"..."}]',
  })
  @IsString()
  @IsOptional()
  'journal.stories'?: string;

  [key: string]: string | undefined
}
