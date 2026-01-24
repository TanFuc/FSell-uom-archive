'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getDisplayPrice } from '@/lib/currency'
import type { Product } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: 'vi' | 'en'
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('admin')
  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const hasImages = product.images && product.images.length > 0
  const mainImage = hasImages ? product.images[0] : null
  const hoverImage = product.hoverImage

  // Get price display with sale logic
  const priceDisplay = getDisplayPrice(product, locale)

  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      className="animate-fade-in group block"
      draggable="false"
    >
      <div
        className="relative mb-4 w-full overflow-hidden rounded-sm bg-muted/20"
        style={{ aspectRatio: '4 / 5' }}
      >
        {mainImage ? (
          <>
            <Image
              src={optimizeProductImage(mainImage)}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="z-0 object-cover object-center transition-transform duration-500 group-hover:scale-105"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              loading="lazy"
              draggable="false"
            />
            {hoverImage && (
              <Image
                src={optimizeProductImage(hoverImage)}
                alt={name}
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
      <div className="mt-4 space-y-1.5">
        <h3
          className="line-clamp-2 h-8 overflow-hidden text-ellipsis font-sans text-[11px] font-medium leading-tight md:h-10 md:text-sm"
          title={name}
        >
          {name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-sans text-[11px] font-medium text-foreground md:text-sm">
            {priceDisplay.currentPrice}
          </p>
          {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
            <p className="text-[9px] text-muted-foreground/30 line-through md:text-[11px]">
              {priceDisplay.originalPrice}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
