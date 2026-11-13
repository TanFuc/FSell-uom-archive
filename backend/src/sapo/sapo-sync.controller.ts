import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { SapoService } from './sapo.service'
import { SapoSyncService } from './sapo-sync.service'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@Controller('admin/sapo-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class SapoSyncController {
  constructor(
    private readonly sapoService: SapoService,
    private readonly syncService: SapoSyncService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Xem trước danh sách sản phẩm từ Sapo (Preview) kèm trạng thái đã có trên web hay chưa
   */
  @Get('preview')
  async getPreviewList(@Query('page') page = '1') {
    const sapoProducts = await this.sapoService.getProductsPreview(Number(page), 50)
    const inbox = await this.prisma.sapoProductInbox.findMany({
      orderBy: { receivedAt: 'desc' },
      take: 100,
    })
    const inboxById = new Map(inbox.map((event) => [event.sapoProductId, event]))
    const listedIds = new Set(sapoProducts.map((product) => String(product.id)))
    const previewProducts = [
      ...sapoProducts,
      ...(Number(page) === 1
        ? inbox.filter((event) => !listedIds.has(event.sapoProductId)).map((event) => event.payload)
        : []),
    ] as any[]

    const sapoIds = previewProducts.map((p) => String(p.id))

    const existingProducts = await this.prisma.product.findMany({
      where: {
        sapoProductId: { in: sapoIds },
        deletedAt: null,
      },
      select: {
        id: true,
        sku: true,
        sapoProductId: true,
        nameVi: true,
        priceVND: true,
      },
    })

    const existingSapoIds = new Set(existingProducts.map((p) => p.sapoProductId).filter(Boolean))

    const items = previewProducts.map((p) => {
      const firstVariant = p.variants?.[0] || {}
      const sku = firstVariant.sku ? String(firstVariant.sku).trim() : ''
      const isSynced = existingSapoIds.has(String(p.id))
      const pendingEvent = inboxById.get(String(p.id))

      const rawImg =
        p.image?.src ||
        p.images?.[0]?.src ||
        (typeof p.image === 'string' ? p.image : null) ||
        (Array.isArray(p.images) && typeof p.images[0] === 'string' ? p.images[0] : null)
      let previewImg = rawImg
      if (previewImg && typeof previewImg === 'string') {
        previewImg = previewImg.trim()
        if (previewImg.startsWith('//')) {
          previewImg = `https:${previewImg}`
        } else if (!previewImg.startsWith('http://') && !previewImg.startsWith('https://')) {
          previewImg = `https://${previewImg}`
        }
      }

      return {
        id: p.id,
        name: p.name || 'Chưa đặt tên',
        sku,
        price: Number(firstVariant.price || 0),
        stock: Number(firstVariant.inventory_quantity || 0),
        image: previewImg || null,
        isSynced,
        webhookTopic: pendingEvent?.topic || null,
        webhookReceivedAt: pendingEvent?.receivedAt || null,
      }
    })
    return { items, page: Number(page), hasMore: sapoProducts.length === 50 }
  }

  /**
   * Đồng bộ các sản phẩm được chọn (Chọn lọc - Không đồng bộ tất cả)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncProducts(
    @Body('productIds') productIds: (string | number)[],
    @Req() req: any,
  ) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một sản phẩm để đồng bộ')
    }

    const userId = req.user?.id
    return this.syncService.syncSelectedProducts(productIds, userId)
  }
}
