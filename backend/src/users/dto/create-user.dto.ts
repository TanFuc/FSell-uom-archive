import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'securePassword123',
    description: 'User password (min 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  fullName: string

  @ApiProperty({
    enum: Role,
    example: Role.MANAGER,
    description: 'User role (ADMIN or MANAGER)',
  })
  @IsEnum(Role)
  role: Role

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user account is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
