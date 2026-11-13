import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator'

export class CreateOrderCheckoutDto {
  @IsString({ message: 'cartId là bắt buộc' })
  @IsNotEmpty()
  cartId: string

  @IsArray({ message: 'itemIds phải là một danh sách chuỗi ID' })
  @IsOptional()
  itemIds?: string[]

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  customerEmail: string

  @IsString({ message: 'Họ tên là bắt buộc' })
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  customerName: string

  @IsString({ message: 'Số điện thoại là bắt buộc' })
  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  phoneNumber: string

  @IsString({ message: 'Địa chỉ giao hàng là bắt buộc' })
  @IsNotEmpty({ message: 'Địa chỉ nhận hàng là bắt buộc' })
  shippingAddress: string

  @IsString()
  @IsOptional()
  note?: string
}
