'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useCustomerStore } from '@/lib/customer-store'
import { useExchangeRate } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import type { Product } from '@/lib/types'
import { optimizeProductImage, cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: 'vi' | 'en'
  priority?: boolean
}

export function ProductCard({ product, locale, priority }: ProductCardProps) {
  const t = useTranslations('admin')
  const { data: exchangeRate } = useExchangeRate({ enabled: locale === 'en' })
  const { isAuthenticated, openAuthModal } = useCustomerStore()
  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const productHref = `/${locale}/shop/${product.slug}`
  const hasImages = product.images && product.images.length > 0
  const mainImage = hasImages ? product.images[0] : null
  const hoverImage = product.hoverImage
  const [shouldLoadHoverImage, setShouldLoadHoverImage] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const anchorLabel =
    locale === 'vi' ? `San pham gom su thu cong: ${name}` : `Handcrafted ceramic product: ${name}`

  const priceDisplay = getDisplayPrice(product, locale, exchangeRate?.rate)

  const handleQuickAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      openAuthModal('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      return
    }

    if (isAdding) return
    setIsAdding(true)
    try {
      await api.addToCart(product.id, 1)
      setIsAdded(true)
      useCustomerStore.getState().fetchCartCount()
      toast.success(
        locale === 'vi'
          ? `Đã thêm vào giỏ hàng: ${name}`
          : `Added to cart: ${name}`,
      )
      setTimeout(() => setIsAdded(false), 2000)
    } catch (err: any) {
      if (err?.response?.status === 401) {
        openAuthModal('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại')
      } else {
        toast.error(
          err?.response?.data?.message ||
            (locale === 'vi' ? 'Không thể thêm sản phẩm' : 'Failed to add to cart'),
        )
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Link
      href={productHref}
      prefetch={false}
      className="animate-fade-in group block"
      draggable="false"
      onMouseEnter={() => {
        setShouldLoadHoverImage(true)
      }}
      onTouchStart={() => {
        setShouldLoadHoverImage(true)
      }}
    >
      <span className="sr-only">{anchorLabel}</span>
      <div
        className="relative mb-4 w-full overflow-hidden rounded-sm bg-muted/20"
        style={{ aspectRatio: '4 / 5' }}
      >
        {mainImage ? (
          <>
            <Image
              src={optimizeProductImage(mainImage)}
              alt={
                locale === 'vi'
                  ? `${name} - Gốm sứ thủ công nghệ thuật ƯƠM. Archive`
                  : `${name} - Handcrafted Art Ceramics by ƯƠM. Archive`
              }
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 31vw"
              quality={priority ? 76 : 68}
              className="z-0 object-cover object-center transition-transform duration-500 group-hover:scale-105"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              draggable="false"
            />
            {hoverImage && shouldLoadHoverImage && (
              <Image
                src={optimizeProductImage(hoverImage)}
                alt={
                  locale === 'vi'
                    ? `${name} (Chi tiết) - Gốm sứ Việt Nam ƯƠM. Archive`
                    : `${name} (Details) - Vietnamese Ceramics by ƯƠM. Archive`
                }
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 31vw"
                quality={64}
                className="z-10 object-cover object-center opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                loading="lazy"
                draggable="false"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {t('noImage')}
          </div>
        )}
        {/* Sale badge */}
        {priceDisplay.hasDiscount && priceDisplay.discountPercentage && (
          <div className="absolute left-2 top-2 z-20 rounded-sm bg-[#991b1b]/90 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white backdrop-blur-sm md:text-[10px]">
            -{priceDisplay.discountPercentage}%
          </div>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-sm border border-[#d4af37]/40 bg-black/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#e5c158] shadow-sm backdrop-blur-md md:text-[9px]">
            <span className="text-[10px] leading-none">★</span>
            <span>{locale === 'vi' ? 'Nổi bật' : 'Featured'}</span>
          </div>
        )}

        {/* Nút Thêm nhanh vào giỏ hàng (Quick Add to Cart) */}
        <button
          type="button"
          onClick={handleQuickAddToCart}
          disabled={isAdding}
          aria-label={locale === 'vi' ? 'Thêm nhanh vào giỏ hàng' : 'Quick add to cart'}
          title={locale === 'vi' ? 'Thêm nhanh vào giỏ hàng' : 'Quick add to cart'}
          className={cn(
            'absolute bottom-2.5 right-2.5 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 text-[#4A4238] shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:bg-[#4A4238] hover:text-white hover:scale-110 active:scale-95 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
            isAdded && 'bg-[#8C7E6A] text-white opacity-100 translate-y-0',
          )}
        >
          {isAdding ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isAdded ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <h3
          className="line-clamp-2 h-7 overflow-hidden text-ellipsis font-sans text-[10px] font-medium leading-tight tracking-wide md:h-8 md:text-xs"
          title={name}
        >
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'font-sans text-[10px] font-medium uppercase tracking-wide md:text-xs',
              priceDisplay.hasDiscount ? 'font-semibold text-[#991b1b]' : 'text-foreground',
            )}
          >
            {priceDisplay.currentPrice}
          </p>
          {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
            <p className="text-[8px] text-muted-foreground/40 line-through md:text-[10px]">
              {priceDisplay.originalPrice}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
