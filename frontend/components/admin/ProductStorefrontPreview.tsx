'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  Plus,
  Minus,
  Instagram,
  Facebook,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency, vndToUsd } from '@/lib/currency'
import { getImageUrl, cn } from '@/lib/utils'

interface ProductStorefrontPreviewProps {
  product: {
    id?: string
    slug: string
    nameVi: string
    nameEn: string
    shortDescriptionVi?: string
    shortDescriptionEn?: string
    descriptionVi: string
    descriptionEn: string
    priceVND: number
    priceUSD?: number
    salePriceVND?: number | null
    salePriceUSD?: number | null
    material?: string | null
    dimensions?: string | null
    stock?: number
    isActive?: boolean
    inquiryEnabled?: boolean
    inquiryMessageVi?: string
    inquiryMessageEn?: string
  }
  images: string[]
  categories?: Array<{ id: string; nameVi: string; nameEn: string }>
  categoryId?: string | null
  exchangeRate?: number
  trustBadges?: any
  trustBadgesEnabled?: boolean
  onSwitchToEdit?: () => void
}

export function ProductStorefrontPreview({
  product,
  images,
  categories,
  categoryId,
  exchangeRate = 25000,
  onSwitchToEdit,
}: ProductStorefrontPreviewProps) {
  const [previewLocale, setPreviewLocale] = useState<'vi' | 'en'>('vi')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const activeCategory = categories?.find((c) => c.id === categoryId)
  const categoryName = activeCategory
    ? previewLocale === 'vi'
      ? activeCategory.nameVi
      : activeCategory.nameEn
    : previewLocale === 'vi'
      ? 'Gốm Thủ Công'
      : 'Artisan Ceramics'

  const name =
    previewLocale === 'vi'
      ? product.nameVi || 'Tên sản phẩm chưa đặt'
      : product.nameEn || 'Untitled product'

  const shortDesc =
    previewLocale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn
  const description =
    previewLocale === 'vi' ? product.descriptionVi : product.descriptionEn

  // Price calculations matching product-client.tsx
  const priceVND = product.priceVND || 0
  const salePriceVND = product.salePriceVND
  const hasDiscount = salePriceVND !== null && salePriceVND !== undefined && salePriceVND < priceVND

  const currentPrice =
    previewLocale === 'vi'
      ? formatCurrency(hasDiscount ? salePriceVND! : priceVND, 'VND')
      : `$${(
          product.priceUSD ??
          vndToUsd(hasDiscount ? salePriceVND! : priceVND, exchangeRate)
        ).toFixed(2)}`

  const originalPrice = hasDiscount
    ? previewLocale === 'vi'
      ? formatCurrency(priceVND, 'VND')
      : `$${(product.priceUSD ?? vndToUsd(priceVND, exchangeRate)).toFixed(2)}`
    : null

  const discountPercentage = hasDiscount
    ? Math.round(((priceVND - salePriceVND!) / priceVND) * 100)
    : null

  const activeImages = images && images.length > 0 ? images : ['/images/placeholder.webp']
  const currentImage = activeImages[selectedImageIndex] || activeImages[0]

  return (
    <div className="flex flex-col bg-white text-black font-sans selection:bg-[#4A4238] selection:text-white border border-neutral-200 shadow-sm rounded-sm overflow-hidden">
      {/* Simulation Control Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-900 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-serif text-xs uppercase tracking-widest font-light text-neutral-200">
            Mô phỏng Giao diện Khách hàng (1:1 Storefront)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <div className="inline-flex rounded-xs bg-neutral-800 p-0.5 border border-neutral-700">
            <button
              type="button"
              onClick={() => setPreviewLocale('vi')}
              className={cn(
                'rounded-xs px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                previewLocale === 'vi'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white',
              )}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setPreviewLocale('en')}
              className={cn(
                'rounded-xs px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                previewLocale === 'en'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white',
              )}
            >
              English
            </button>
          </div>

          {/* Live Storefront Link */}
          {product.slug && (
            <a
              href={`/${previewLocale}/shop/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xs border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <span>Xem trang thật</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="rounded-xs bg-white px-3 py-1 text-xs font-medium text-black hover:bg-neutral-200 transition-colors"
            >
              Quay lại Form sửa
            </button>
          )}
        </div>
      </div>

      {/* 1:1 Real Storefront Product Page Layout */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-white">
        {/* Breadcrumb matching Storefront */}
        <div className="mb-6 flex items-center gap-2 font-serif text-xs font-light tracking-wide text-neutral-400 uppercase">
          <span>{previewLocale === 'vi' ? 'Trang chủ' : 'Home'}</span>
          <span>/</span>
          <span>{previewLocale === 'vi' ? 'Cửa hàng' : 'Shop'}</span>
          <span>/</span>
          <span className="text-black font-normal">{categoryName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* 1. Left Column: Image Gallery (aspect-[3/4] matching storefront) */}
          <div className="space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 rounded-none border border-neutral-200">
              <Image
                src={getImageUrl(currentImage)}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-all duration-300"
                priority
              />

              {hasDiscount && (
                <div className="absolute top-4 left-4 rounded-xs bg-[#991b1b] px-2.5 py-1 text-xs font-light uppercase tracking-wider text-white shadow-xs">
                  −{discountPercentage}%
                </div>
              )}

              {/* Navigation arrows */}
              {activeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === 0 ? activeImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-black shadow-xs transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === activeImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-black shadow-xs transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {activeImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      'relative aspect-[3/4] w-16 sm:w-20 shrink-0 overflow-hidden border transition-all cursor-pointer',
                      selectedImageIndex === idx
                        ? 'border-black ring-1 ring-black'
                        : 'border-neutral-200 opacity-60 hover:opacity-100',
                    )}
                  >
                    <Image
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Right Column: Product Detail & Purchase Information */}
          <div className="space-y-6 md:space-y-7">
            {/* Info Header */}
            <div className="space-y-3">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-wider leading-tight text-black">
                {name}
              </h1>

              {/* Price Row */}
              <div className="flex flex-wrap items-baseline gap-3">
                <p
                  className={cn(
                    'font-serif text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-black',
                    hasDiscount && 'text-[#991b1b]',
                  )}
                >
                  {currentPrice}
                </p>
                {hasDiscount && originalPrice && (
                  <>
                    <p className="font-serif text-sm sm:text-base font-thin text-neutral-400 line-through">
                      {originalPrice}
                    </p>
                    {discountPercentage && (
                      <span className="rounded-xs bg-[#991b1b] px-2 py-0.5 font-serif text-xs font-light tracking-wide text-white">
                        −{discountPercentage}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Details Section - Clean Unboxed Editorial Presentation matching Storefront */}
            <div className="space-y-3.5 pt-1 text-black">
              {/* Short Description (body Thin) */}
              {shortDesc && (
                <p className="font-serif font-thin text-sm sm:text-base leading-relaxed text-black">
                  {shortDesc}
                </p>
              )}

              {/* Specifications: Material & Dimensions */}
              {product.material && (
                <p className="font-serif text-sm sm:text-base text-black leading-relaxed">
                  <span className="font-light">{previewLocale === 'vi' ? 'Chất liệu ' : 'Material '}</span>
                  <span className="font-light">{product.material}</span>
                </p>
              )}

              {product.dimensions && (
                <p className="font-serif text-sm sm:text-base text-black leading-relaxed">
                  <span className="font-light">{previewLocale === 'vi' ? 'Kích thước ' : 'Dimensions '}</span>
                  <span className="font-thin">{product.dimensions}</span>
                </p>
              )}

              {/* Detailed Description HTML (prose preserving font sizes, font weights, colors) */}
              {description && (
                <div
                  className="prose prose-stone max-w-none overflow-hidden font-serif text-sm sm:text-base font-thin leading-relaxed text-black [overflow-wrap:anywhere] pt-1 [&_p]:leading-[1.75] [&_p]:mb-3 [&_p]:text-black [&_strong]:font-semibold [&_strong]:text-black [&_b]:font-semibold [&_b]:text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-black [&_li]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}

              {/* Explore all products CTA */}
              <div className="pt-2">
                <Link
                  href={`/${previewLocale}/shop`}
                  className="group inline-flex items-center gap-2 font-serif text-xs sm:text-[13px] uppercase tracking-[0.18em] text-black hover:opacity-60 transition-all duration-300 py-1"
                >
                  <span className="relative font-light pb-0.5 border-b border-black/40 group-hover:border-black transition-colors duration-300">
                    {previewLocale === 'vi' ? 'Xem tất cả tác phẩm' : 'View all products'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-black" />
                </Link>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4 pt-6 border-t border-neutral-200">
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-neutral-300 bg-white rounded-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-2.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-serif text-xs px-2 min-w-[32px] text-center font-light text-black">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3.5 py-2.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className="flex-1 py-3 px-6 bg-black text-white hover:bg-neutral-800 transition-colors uppercase tracking-[0.2em] text-xs font-light flex items-center justify-center gap-2 shadow-xs cursor-pointer rounded-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{previewLocale === 'vi' ? 'Thêm vào giỏ' : 'Add to cart'}</span>
                </button>
              </div>

              <p className="text-[11px] text-neutral-500 font-serif font-thin tracking-wide">
                {previewLocale === 'vi'
                  ? 'Vui lòng đăng nhập tài khoản để thêm vào giỏ và hoàn tất thanh toán'
                  : 'Please sign in to add this item to cart and proceed to checkout'}
              </p>
            </div>

            {/* Direct Consultation Row matching Storefront */}
            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-serif text-[11px] font-light text-neutral-500 uppercase tracking-wider">
                {previewLocale === 'vi' ? 'Hỗ trợ tư vấn trực tiếp:' : 'Direct consultation:'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://instagram.com/uomarchive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-light uppercase tracking-[0.12em] border border-neutral-200 hover:border-black hover:text-black text-neutral-600 transition-colors rounded-xs bg-neutral-50"
                >
                  <Instagram className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://m.me/uomarchive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-light uppercase tracking-[0.12em] border border-neutral-200 hover:border-black hover:text-black text-neutral-600 transition-colors rounded-xs bg-neutral-50"
                >
                  <Facebook className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
