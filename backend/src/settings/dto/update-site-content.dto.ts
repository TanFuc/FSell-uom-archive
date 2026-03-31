import { IsString, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

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
  'footer.text.en'?: string;

  // Allow any additional content keys
  [key: string]: string | undefined
}
