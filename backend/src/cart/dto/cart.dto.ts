import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator'

export class AddToCartDto {
  @IsString({ message: 'ProductId là bắt buộc' })
  @IsNotEmpty()
  productId: string

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number

  @IsString()
  @IsOptional()
  sessionId?: string
}

export class UpdateCartItemDto {
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number
}
