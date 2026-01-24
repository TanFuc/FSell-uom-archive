import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { ProductsService } from './products.service'
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  BulkDeleteDto,
  BulkUpdateDto,
  BulkRestoreDto,
} from './dto'
import { JwtAuthGuard, RolesGuard } from '../auth/guards'
import { Roles, CurrentUser, JwtPayload } from '../auth/decorators'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all products (public)' })
  @ApiResponse({ status: 200, description: 'List of active products' })
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug)
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all products including inactive/deleted (admin)' })
  @ApiResponse({ status: 200, description: 'List of all products' })
  async findAllAdmin(
    @Query() query: QueryProductsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.findAll(query, user.role as Role)
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Product statistics' })
  async getStats() {
    return this.productsService.getStats()
  }

  @Get('admin/id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get product by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.create(dto, user.sub)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.update(id, dto, user.sub)
  }

  // ==================== DELETE ENDPOINTS ====================

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product soft deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.softDelete(id, user.sub, user.role as Role)
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Permanently delete a product (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product permanently deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async hardDelete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.hardDelete(id, user.role as Role)
  }

  // ==================== RESTORE ENDPOINT ====================

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore a soft-deleted product (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product restored' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.restore(id, user.sub, user.role as Role)
  }

  // ==================== DUPLICATE ENDPOINT ====================

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Duplicate a product' })
  @ApiParam({ name: 'id', description: 'Product ID to duplicate' })
  @ApiResponse({ status: 201, description: 'Product duplicated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.duplicate(id, user.sub)
  }

  // ==================== BULK OPERATIONS ====================

  @Post('bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk soft delete products' })
  @ApiResponse({ status: 200, description: 'Products deleted' })
  async bulkDelete(
    @Body() dto: BulkDeleteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.bulkSoftDelete(dto.ids, user.sub, user.role as Role)
  }

  @Patch('bulk/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update products' })
  @ApiResponse({ status: 200, description: 'Products updated' })
  async bulkUpdate(
    @Body() dto: BulkUpdateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.bulkUpdate(dto, user.sub)
  }

  @Post('bulk/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk restore deleted products (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Products restored' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  async bulkRestore(
    @Body() dto: BulkRestoreDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.bulkRestore(dto.ids, user.sub, user.role as Role)
  }
}
