import { ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, IsEmail } from 'class-validator'

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'updated@example.com',
    description: 'User email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    example: 'John Updated',
    description: 'User full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string

  @ApiPropertyOptional({
    enum: Role,
    example: Role.MANAGER,
    description: 'User role',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user account is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    example: 'newPassword123',
    description: 'New password (min 8 characters)',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string
}
