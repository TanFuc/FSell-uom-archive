import { IsString, IsInt, IsArray, Min, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator'
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
    description: 'Price in VND',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  priceVND: number

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Array of product image URLs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[]

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
}
