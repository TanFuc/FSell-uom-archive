import { IsString, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateThemeDto {
  @ApiProperty({
    example: '#F9F7F1',
    description: 'Background color in hex format',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })
  backgroundColor: string

  @ApiProperty({
    example: '#4A4238',
    description: 'Text color in hex format',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })
  textColor: string

  @ApiProperty({
    example: '#8C7E6A',
    description: 'Accent color in hex format',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' })
  accentColor: string
}
