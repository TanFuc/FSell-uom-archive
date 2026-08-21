'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useExchangeRate } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import type { Product } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: 'vi' | 'en'
  priority?: boolean
}

export function ProductCard({ product, locale, priority }: ProductCardProps) {
  const t = useTranslations('admin')
  const { data: exchangeRate } = useExchangeRate({ enabled: locale === 'en' })
  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const hasImages = product.images && product.images.length > 0
  const mainImage = hasImages ? product.images[0] : null
  const hoverImage = product.hoverImage
  const [shouldLoadHoverImage, setShouldLoadHoverImage] = useState(false)
  const anchorLabel =
    locale === 'vi' ? `San pham gom su thu cong: ${name}` : `Handcrafted ceramic product: ${name}`

  const priceDisplay = getDisplayPrice(product, locale, exchangeRate?.rate)

  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      className="animate-fade-in group block"
      prefetch={false}
      draggable="false"
      onMouseEnter={() => setShouldLoadHoverImage(true)}
      onTouchStart={() => setShouldLoadHoverImage(true)}
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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
          <div className="absolute left-2 top-2 z-20 rounded bg-red-500 px-2 py-1 text-xs text-white">
            -{priceDisplay.discountPercentage}%
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3
          className="line-clamp-2 h-7 overflow-hidden text-ellipsis font-sans text-[10px] font-medium leading-tight tracking-wide md:h-8 md:text-xs"
          title={name}
        >
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-sans text-[10px] font-medium uppercase tracking-wide text-foreground md:text-xs">
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
