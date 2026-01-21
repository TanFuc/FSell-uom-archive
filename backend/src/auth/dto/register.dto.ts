import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'password123',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
    maxLength: 100,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string
}
