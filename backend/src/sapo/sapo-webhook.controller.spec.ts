import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { createHmac } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { SapoSyncService } from './sapo-sync.service'
import { SapoWebhookController } from './sapo-webhook.controller'

describe('Sapo product webhooks', () => {
  const productData = {
    id: 123,
    name: 'Sapo title',
    variants: [{ sku: 'LOCAL-SKU', price: '125000', inventory_quantity: 4 }],
  }
  let prisma: {
    sapoProductInbox: { upsert: jest.Mock }
    sapoWebhookLog: { create: jest.Mock; update: jest.Mock }
    product: { findFirst: jest.Mock; update: jest.Mock }
  }
  let sync: { invalidateProductCache: jest.Mock }
  let controller: SapoWebhookController
  const dispatch = (target: SapoWebhookController) =>
    (
      target as unknown as {
        handleProductEvent: (topic: string, data: typeof productData) => Promise<void>
      }
    ).handleProductEvent('products/update', productData)

  beforeEach(() => {
    prisma = {
      sapoProductInbox: { upsert: jest.fn() },
      sapoWebhookLog: { create: jest.fn().mockResolvedValue({ id: 'log-1' }), update: jest.fn() },
      product: { findFirst: jest.fn(), update: jest.fn() },
    }
    sync = { invalidateProductCache: jest.fn() }
    controller = new SapoWebhookController(
      prisma as unknown as PrismaService,
      {} as RedisService,
      sync as unknown as SapoSyncService,
      {} as ConfigService,
    )
  })

  it('keeps an unapproved product in the sync inbox without publishing it, even when its SKU matches', async () => {
    prisma.product.findFirst.mockResolvedValue(null)
    await dispatch(controller)
    expect(prisma.sapoProductInbox.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sapoProductId: '123' } }),
    )
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { sapoProductId: '123', deletedAt: null },
    })
    expect(prisma.product.update).not.toHaveBeenCalled()
  })

  it('updates commerce fields while preserving admin edited copy and images', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'local-1',
      slug: 'edited-slug',
      nameVi: 'Admin copy',
    })
    await dispatch(controller)
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'local-1' },
      data: { priceVND: 125000, stock: 4 },
    })
    expect(sync.invalidateProductCache).toHaveBeenCalledWith('local-1', 'edited-slug')
  })

  it('rejects an invalid webhook signature before writing any event', async () => {
    const body = Buffer.from(JSON.stringify({ product: productData }))
    const config = { get: jest.fn().mockReturnValue('webhook-secret') }
    const signedController = new SapoWebhookController(
      prisma as unknown as PrismaService,
      {} as RedisService,
      sync as unknown as SapoSyncService,
      config as unknown as ConfigService,
    )
    await expect(
      signedController.handleWebhook({ product: productData }, { rawBody: body } as any, 'products/update', 'invalid'),
    ).rejects.toThrow(UnauthorizedException)
    expect(prisma.sapoProductInbox.upsert).not.toHaveBeenCalled()
  })

  it('accepts the HMAC over the original request bytes', async () => {
    const body = Buffer.from(JSON.stringify({ product: productData }))
    const signature = createHmac('sha256', 'webhook-secret').update(body).digest('base64')
    const config = { get: jest.fn().mockReturnValue('webhook-secret') }
    const redis = { exists: jest.fn().mockResolvedValue(false), setWithTtl: jest.fn() }
    prisma.product.findFirst.mockResolvedValue(null)
    const signedController = new SapoWebhookController(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      sync as unknown as SapoSyncService,
      config as unknown as ConfigService,
    )
    await expect(
      signedController.handleWebhook({ product: productData }, { rawBody: body } as any, 'products/update', signature),
    ).resolves.toEqual({ success: true, topic: 'products/update' })
    expect(prisma.sapoProductInbox.upsert).toHaveBeenCalledTimes(1)
  })
})
