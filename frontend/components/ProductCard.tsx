'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { Product } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'
import { getDisplayPrice } from '@/lib/currency'

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
      className="group block animate-fade-in"
    >
      <div className="relative w-full bg-muted/20 overflow-hidden mb-4 rounded-sm" style={{ aspectRatio: '4 / 5' }}>
        {mainImage ? (
          <>
            <Image
              src={optimizeProductImage(mainImage)}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105 z-0"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              loading="lazy"
            />
            {hoverImage && (
              <Image
                src={optimizeProductImage(hoverImage)}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105 z-10"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {t('noImage')}
          </div>
        )}
        {/* Sale badge */}
        {priceDisplay.hasDiscount && priceDisplay.discountPercentage && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-20">
            -{priceDisplay.discountPercentage}%
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm md:text-base font-serif font-medium leading-tight line-clamp-2 h-9 md:h-10 overflow-hidden text-ellipsis" title={name}>
          {name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm md:text-lg text-muted-foreground font-serif font-light">
            {priceDisplay.currentPrice}
          </p>
          {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
            <p className="text-xs md:text-sm text-muted-foreground/60 line-through">
              {priceDisplay.originalPrice}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

