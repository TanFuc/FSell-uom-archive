import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AddToCartDto } from './dto/cart.dto'

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy giỏ hàng đang hoạt động (chưa bị soft delete) theo customerId hoặc sessionId
   */
  async getOrCreateCart(params: { customerId?: string; sessionId?: string }) {
    const { customerId, sessionId } = params

    if (!customerId && !sessionId) {
      throw new BadRequestException('Phải cung cấp customerId hoặc sessionId')
    }

    let cart = await this.prisma.cart.findFirst({
      where: {
        OR: [
          ...(customerId ? [{ customerId }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                nameVi: true,
                nameEn: true,
                priceVND: true,
                salePriceVND: true,
                images: true,
                stock: true,
                sku: true,
              },
            },
          },
        },
      },
    })

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          customerId: customerId || null,
          sessionId: sessionId || null,
        },
        include: {
          items: {
            where: { deletedAt: null },
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  nameVi: true,
                  nameEn: true,
                  priceVND: true,
                  salePriceVND: true,
                  images: true,
                  stock: true,
                  sku: true,
                },
              },
            },
          },
        },
      })
    }

    return cart
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(dto: AddToCartDto, customerId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null, isActive: true },
    })

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh')
    }

    const cart = await this.getOrCreateCart({
      customerId,
      sessionId: dto.sessionId,
    })

    const priceVND = product.salePriceVND || product.priceVND

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
        deletedAt: null,
      },
    })

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          priceVND,
          updatedAt: new Date(),
        },
      })
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity,
          priceVND,
        },
      })
    }

    return this.getOrCreateCart({ customerId, sessionId: dto.sessionId })
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ
   */
  async updateItemQuantity(cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, deletedAt: null },
    })

    if (!item) {
      throw new NotFoundException('Mục giỏ hàng không tồn tại')
    }

    if (quantity <= 0) {
      // SOFT DELETE (Bảo toàn dữ liệu - Không xóa vật lý)
      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { deletedAt: new Date() },
      })
    } else {
      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity, updatedAt: new Date() },
      })
    }

    return { success: true }
  }

  /**
   * Xóa sản phẩm khỏi giỏ (Soft Delete)
   */
  async removeItem(cartItemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, deletedAt: null },
    })

    if (!item) {
      throw new NotFoundException('Mục giỏ hàng không tồn tại')
    }

    // SOFT DELETE: Tuyệt đối không dùng delete()
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { deletedAt: new Date() },
    })

    return { success: true }
  }
}
