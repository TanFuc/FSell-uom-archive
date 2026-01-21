import { IsEmail, IsString, IsBoolean, IsInt, IsOptional, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({
    example: 'admin@uomarchive.com',
    description: 'Admin email for order notifications',
  })
  @IsEmail()
  @IsOptional()
  adminEmail?: string

  @ApiPropertyOptional({
    example: '0912345678',
    description: 'Admin phone number for Zalo notifications',
  })
  @IsString()
  @IsOptional()
  adminPhone?: string

  @ApiPropertyOptional({
    example: true,
    description: 'Enable email notifications',
  })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean

  @ApiPropertyOptional({
    example: false,
    description: 'Enable Zalo notifications',
  })
  @IsBoolean()
  @IsOptional()
  zaloEnabled?: boolean

  @ApiPropertyOptional({
    example: false,
    description: 'Enable Facebook Messenger notifications',
  })
  @IsBoolean()
  @IsOptional()
  facebookEnabled?: boolean

  @ApiPropertyOptional({
    example: 'smtp.gmail.com',
    description: 'SMTP host',
  })
  @IsString()
  @IsOptional()
  smtpHost?: string

  @ApiPropertyOptional({
    example: 587,
    description: 'SMTP port',
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  smtpPort?: number

  @ApiPropertyOptional({
    example: 'your-email@gmail.com',
    description: 'SMTP username',
  })
  @IsString()
  @IsOptional()
  smtpUser?: string

  @ApiPropertyOptional({
    example: 'your-app-password',
    description: 'SMTP password',
  })
  @IsString()
  @IsOptional()
  smtpPassword?: string

  @ApiPropertyOptional({
    example: 'your-zalo-oa-id',
    description: 'Zalo Official Account ID',
  })
  @IsString()
  @IsOptional()
  zaloOAId?: string

  @ApiPropertyOptional({
    example: 'your-zalo-access-token',
    description: 'Zalo access token',
  })
  @IsString()
  @IsOptional()
  zaloAccessToken?: string

  @ApiPropertyOptional({
    example: 'EAAxxxx...',
    description: 'Facebook Page access token',
  })
  @IsString()
  @IsOptional()
  facebookPageAccessToken?: string
}
