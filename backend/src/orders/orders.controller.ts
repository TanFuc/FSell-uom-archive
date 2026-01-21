import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { OrdersService } from './orders.service'
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto'
import { JwtAuthGuard, RolesGuard } from '../auth/guards'
import { Roles } from '../auth/decorators'

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (guest checkout)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product or insufficient stock' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query)
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Order statistics' })
  async getStats() {
    return this.ordersService.getOrderStats()
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number (public)' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-1234567890)' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id)
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto)
  }
}
