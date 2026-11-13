import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'new-email@example.com',
    description: 'New login email',
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    example: 'currentPassword123',
    description: 'Current password (required when changing password)',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string

  @ApiPropertyOptional({
    example: 'newPassword123',
    description: 'New password (minimum 8 characters)',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string
}
