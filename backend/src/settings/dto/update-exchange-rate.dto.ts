import { IsNumber, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateExchangeRateDto {
  @ApiProperty({
    example: 25000,
    description: 'VND to USD exchange rate (1 USD = X VND)',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  rate: number
}
