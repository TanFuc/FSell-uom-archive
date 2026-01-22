'use client'


import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: 'vi' | 'en'
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const hasImages = product.images && product.images.length > 0
  const mainImage = hasImages ? product.images[0] : null
  const hoverImage = product.hoverImage

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
            No Image
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-base md:text-lg font-medium leading-tight line-clamp-2 min-h-[3rem] transition-all">
          {name}
        </h3>
        <p className="text-base md:text-lg text-muted-foreground font-light">
          {product.priceVND.toLocaleString('vi-VN')}₫
        </p>
      </div>
    </Link>
  )
}

