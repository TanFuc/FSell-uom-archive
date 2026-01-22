'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
  locale: 'vi' | 'en'
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const hasImages = product.images && product.images.length > 0

  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      className="group block animate-fade-in"
    >
      <div className="relative aspect-product bg-muted/20 overflow-hidden mb-4">
        {hasImages ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <h3 className="mb-2 group-hover:italic transition-all">{name}</h3>
      <p className="text-muted-foreground">
        {product.priceVND.toLocaleString('vi-VN')} VND
      </p>
    </Link>
  )
}

