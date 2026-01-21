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
      <div className="aspect-product bg-muted/20 overflow-hidden mb-4">
        {hasImages ? (
          <Image
            src={product.images[0]}
            alt={name}
            width={400}
            height={533}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

export default ProductCard
        <p className="text-muted-foreground mt-1">{price}</p>
      </div>
    </Link>
  )
}

export default memo(ProductCard)
