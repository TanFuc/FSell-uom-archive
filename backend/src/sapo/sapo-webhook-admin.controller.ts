import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'
import { SapoService } from './sapo.service'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller(['admin/sapo-webhooks', 'api/admin/sapo-webhooks'])
@UseGuards(JwtAuthGuard)
export class SapoWebhookAdminController {
  constructor(
    private readonly sapoService: SapoService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Lấy danh sách Webhook đã đăng ký trên Sapo: GET /admin/webhooks.json
   */
  @Get()
  async getWebhooks(
    @Query('topic') topic?: string,
    @Query('address') address?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('since_id') sinceId?: string,
    @Query('created_on_min') createdOnMin?: string,
    @Query('created_on_max') createdOnMax?: string,
    @Query('modified_on_min') modifiedOnMin?: string,
    @Query('modified_on_max') modifiedOnMax?: string,
    @Query('fields') fields?: string,
  ) {
    return this.sapoService.getWebhooks({
      topic,
      address,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
      since_id: sinceId,
      created_on_min: createdOnMin,
      created_on_max: createdOnMax,
      modified_on_min: modifiedOnMin,
      modified_on_max: modifiedOnMax,
      fields,
    })
  }

  /**
   * Lấy tổng số lượng Webhook: GET /admin/webhooks/count.json
   */
  @Get('count')
  async getWebhookCount(
    @Query('topic') topic?: string,
    @Query('address') address?: string,
  ) {
    const count = await this.sapoService.getWebhookCount({ topic, address })
    return { count }
  }

  /**
   * Lấy lịch sử webhook logs từ cơ sở dữ liệu nội bộ
   */
  @Get('logs')
  async getWebhookLogs(
    @Query('topic') topic?: string,
    @Query('status') status?: string,
    @Query('sapoOrderId') sapoOrderId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const p = Math.max(1, Number(page) || 1)
    const l = Math.min(100, Math.max(1, Number(limit) || 50))
    const skip = (p - 1) * l

    const where: any = { deletedAt: null }
    if (topic) where.topic = { contains: topic }
    if (status) where.status = status
    if (sapoOrderId) where.sapoOrderId = sapoOrderId

    const [total, logs] = await Promise.all([
      this.prisma.sapoWebhookLog.count({ where }),
      this.prisma.sapoWebhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
    ])

    return {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      data: logs,
    }
  }

  /**
   * Lấy thông tin chi tiết một Webhook theo ID: GET /admin/webhooks/{id}.json
   */
  @Get(':id')
  async getWebhookDetail(@Param('id') id: string) {
    return this.sapoService.getWebhookDetail(id)
  }

  /**
   * Tạo mới một Webhook trên Sapo: POST /admin/webhooks.json
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWebhook(
    @Body() body: { topic: string; address: string; format?: 'json' | 'xml' },
  ) {
    if (!body?.topic || !body?.address) {
      throw new BadRequestException('Vui lòng cung cấp đầy đủ "topic" và "address"')
    }
    return this.sapoService.createWebhook(body.topic, body.address, body.format || 'json')
  }

  /**
   * Cập nhật một Webhook: PUT /admin/webhooks/{id}.json
   */
  @Put(':id')
  async updateWebhook(
    @Param('id') id: string,
    @Body() body: { address?: string; topic?: string },
  ) {
    return this.sapoService.updateWebhook(id, body)
  }

  /**
   * Xóa một Webhook: DELETE /admin/webhooks/{id}.json
   */
  @Delete(':id')
  async deleteWebhook(@Param('id') id: string) {
    const success = await this.sapoService.deleteWebhook(id)
    return { success }
  }

  /**
   * Đăng ký đồng loạt tất cả các Webhook chuẩn cho hệ thống
   */
  @Post('register-all')
  @HttpCode(HttpStatus.OK)
  async registerAll(@Body('address') address?: string, @Req() req?: any) {
    let webhookUrl = address?.trim()

    if (!webhookUrl) {
      // Tự động nhận diện domain hoặc fallback
      const proto = req?.headers['x-forwarded-proto'] || 'https'
      const host = req?.headers['host'] || 'localhost:3000'
      webhookUrl = `${proto}://${host}/sapo/webhook`
    }

    return this.sapoService.registerAllDefaultWebhooks(webhookUrl)
  }
}
