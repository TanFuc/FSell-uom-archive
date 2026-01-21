import {
  IsEmail,
  IsString,
  IsArray,
  IsInt,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  Min,
  IsOptional,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Language } from '@prisma/client'

export class OrderItemDto {
  @ApiProperty({
    example: 'clq1abc123',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string

  @ApiProperty({
    example: 2,
    description: 'Quantity',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  customerEmail: string

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Customer name',
  })
  @IsString()
  @IsNotEmpty()
  customerName: string

  @ApiProperty({
    example: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Shipping address',
  })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string

  @ApiProperty({
    example: '0912345678',
    description: 'Customer phone number',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Order items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]

  @ApiPropertyOptional({
    enum: Language,
    example: 'VI',
    description: 'Customer language preference',
    default: 'VI',
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language = Language.VI
}
