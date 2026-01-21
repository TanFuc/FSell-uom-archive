import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrdersDto } from './dto'

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOrderDto) {
    // Validate products and calculate total
    let totalVND = 0
    const productDetails: Array<{
      productId: string
      quantity: number
      priceVND: number
    }> = []

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new BadRequestException(`Product with ID "${item.productId}" not found`)
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.nameEn}" is not available`)
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.nameEn}". Available: ${product.stock}`,
        )
      }

      totalVND += product.priceVND * item.quantity
      productDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        priceVND: product.priceVND,
      })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerEmail: dto.customerEmail,
          customerName: dto.customerName,
          shippingAddress: dto.shippingAddress,
          phoneNumber: dto.phoneNumber,
          totalVND,
          language: dto.language,
          items: {
            create: productDetails.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceVND: item.priceVND,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update stock for each product
      for (const item of productDetails) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return newOrder
    })

    this.logger.log(`Order created: ${orderNumber}`)

    // Send notifications (non-blocking)
    this.notificationsService
      .sendOrderNotifications(order)
      .catch((err) => this.logger.error('Notification error:', err))

    return order
  }

  async findAll(query: QueryOrdersDto) {
    const { page = 1, limit = 20, status, email } = query

    const where: Prisma.OrderWhereInput = {}

    if (status) {
      where.status = status
    }

    if (email) {
      where.customerEmail = { contains: email, mode: 'insensitive' }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ])

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundException(`Order with number "${orderNumber}" not found`)
    }

    return order
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`)
    }

    return order
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`)
    }

    // If cancelling, restore stock
    if (dto.status === 'cancelled' && order.status !== 'cancelled') {
      await this.prisma.$transaction(async (tx) => {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        })

        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        await tx.order.update({
          where: { id },
          data: { status: dto.status },
        })
      })

      this.logger.log(`Order cancelled and stock restored: ${order.orderNumber}`)
    } else {
      await this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
      })

      this.logger.log(`Order status updated: ${order.orderNumber} -> ${dto.status}`)
    }

    return this.findById(id)
  }

  async getOrderStats() {
    const [totalOrders, pendingOrders, totalRevenue] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'pending' } }),
      this.prisma.order.aggregate({
        _sum: { totalVND: true },
        where: { status: { not: 'cancelled' } },
      }),
    ])

    return {
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.totalVND || 0,
    }
  }
}
