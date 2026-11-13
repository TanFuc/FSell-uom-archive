import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class CreateFulfillmentDto {
  @IsString()
  @IsOptional()
  trackingNumber?: string

  @IsString()
  @IsOptional()
  trackingCompany?: string

  @IsString()
  @IsOptional()
  trackingUrl?: string

  @IsBoolean()
  @IsOptional()
  sendNotificationEmail?: boolean
}
