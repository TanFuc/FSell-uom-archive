import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator'

export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional({ description: 'Mẫu nội dung chuyển khoản; dùng {orderNumber} và {totalVND}' })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  transferTemplates?: { id: string; name: string; content: string }[]

  @ApiPropertyOptional({ description: 'ID mẫu nội dung chuyển khoản đang dùng' })
  @IsOptional()
  @IsString()
  activeTemplateId?: string
  @ApiPropertyOptional({ description: 'URL ảnh mã QR thanh toán của cửa hàng' })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string

  @ApiPropertyOptional({ description: 'Tên ngân hàng (ví dụ: Vietcombank, Techcombank)' })
  @IsOptional()
  @IsString()
  bankName?: string

  @ApiPropertyOptional({ description: 'Số tài khoản ngân hàng' })
  @IsOptional()
  @IsString()
  accountNumber?: string

  @ApiPropertyOptional({ description: 'Tên chủ tài khoản' })
  @IsOptional()
  @IsString()
  accountHolder?: string

  @ApiPropertyOptional({ description: 'Hướng dẫn chuyển khoản' })
  @IsOptional()
  @IsString()
  transferInstruction?: string

  @ApiPropertyOptional({ description: 'Ghi chú thêm' })
  @IsOptional()
  @IsString()
  note?: string
}
