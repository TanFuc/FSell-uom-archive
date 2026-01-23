import { IsString, IsInt, IsArray, Min, IsNotEmpty, IsBoolean, IsOptional, IsNumber } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateProductDto {
  @ApiProperty({
    example: 'ceramic-vase-01',
    description: 'URL-friendly product slug',
  })
  @IsString()
  @IsNotEmpty()
  slug: string

  @ApiProperty({
    example: 'Bình Gốm Trắng',
    description: 'Product name in Vietnamese',
  })
  @IsString()
  @IsNotEmpty()
  nameVi: string

  @ApiProperty({
    example: 'White Ceramic Vase',
    description: 'Product name in English',
  })
  @IsString()
  @IsNotEmpty()
  nameEn: string

  @ApiPropertyOptional({
    example: 'Mô tả ngắn gọn về sản phẩm',
    description: 'Product short description in Vietnamese',
  })
  @IsString()
  @IsOptional()
  shortDescriptionVi?: string

  @ApiPropertyOptional({
    example: 'Brief product description',
    description: 'Product short description in English',
  })
  @IsString()
  @IsOptional()
  shortDescriptionEn?: string

  @ApiProperty({
    example: 'Bình gốm trắng thủ công với thiết kế tối giản',
    description: 'Product description in Vietnamese',
  })
  @IsString()
  @IsNotEmpty()
  descriptionVi: string

  @ApiProperty({
    example: 'Handcrafted white ceramic vase with minimalist design',
    description: 'Product description in English',
  })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string

  @ApiProperty({
    example: 1200000,
    description: 'Price in VND (Original/List Price)',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  priceVND: number

  @ApiPropertyOptional({
    example: 48.0,
    description: 'Price in USD (auto-calculated from VND if not provided)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceUSD?: number

  @ApiPropertyOptional({
    example: 1000000,
    description: 'Sale/Discount price in VND (if product is on sale)',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  salePriceVND?: number

  @ApiPropertyOptional({
    example: 40.0,
    description: 'Sale/Discount price in USD (auto-calculated from salePriceVND if not provided)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePriceUSD?: number

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Array of product image URLs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[]

  @ApiPropertyOptional({
    example: 'https://example.com/hover-image.jpg',
    description: 'Image URL shown on hover (optional)',
  })
  @IsString()
  @IsOptional()
  hoverImage?: string

  @ApiProperty({
    example: 'Gốm sứ cao cấp',
    description: 'Product material',
  })
  @IsString()
  @IsNotEmpty()
  material: string

  @ApiProperty({
    example: '15cm x 15cm x 30cm',
    description: 'Product dimensions',
  })
  @IsString()
  @IsNotEmpty()
  dimensions: string

  @ApiProperty({
    example: 10,
    description: 'Stock quantity',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is featured',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean

  // Inquiry Feature Fields
  @ApiPropertyOptional({
    example: true,
    description: 'Enable inquiry button for this product',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  inquiryEnabled?: boolean

  @ApiPropertyOptional({
    example: 'Xin chào! Tôi quan tâm đến sản phẩm này...',
    description: 'Pre-filled inquiry message in Vietnamese',
  })
  @IsString()
  @IsOptional()
  inquiryMessageVi?: string

  @ApiPropertyOptional({
    example: 'Hello! I am interested in this product...',
    description: 'Pre-filled inquiry message in English',
  })
  @IsString()
  @IsOptional()
  inquiryMessageEn?: string

  @ApiPropertyOptional({
    example: ['prod_123', 'prod_456'],
    description: 'IDs of related products',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedProductIds?: string[]

  @ApiPropertyOptional({
    example: 'category_id_123',
    description: 'Category ID of the product',
  })
  @IsString()
  @IsOptional()
  categoryId?: string
}
