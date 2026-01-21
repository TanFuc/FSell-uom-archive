import { IsString, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ORDER_STATUSES,
    example: 'paid',
    description: 'New order status',
  })
  @IsString()
  @IsIn(ORDER_STATUSES)
  status: OrderStatus
}
