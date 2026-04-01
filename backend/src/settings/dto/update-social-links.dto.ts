import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class UpdateSocialLinksDto {
  @ApiPropertyOptional({
    example: 'https://m.me/uomarchive',
    description: 'Facebook Messenger URL for inquiries (e.g., https://m.me/uomarchive)',
  })
  @IsString()
  @IsOptional()
  facebookPageUrl?: string

  @ApiPropertyOptional({
    example: 'uomarchive',
    description: 'Instagram username for inquiries (without @)',
  })
  @IsString()
  @IsOptional()
  instagramUsername?: string
}
