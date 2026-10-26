'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import {
  ShoppingBag,
  Plus,
  Minus,
  PackageCheck,
  Sparkles,
  ShieldCheck,
  Instagram,
  Facebook,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Truck,
  Award,
  Heart,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency, vndToUsd } from '@/lib/currency'
import { getImageUrl } from '@/lib/utils'

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
  trustBadges?: Array<{
    id: string
    icon: string
    titleVi: string
    titleEn: string
    isVisible: boolean
  }>
  trustBadgesEnabled?: boolean
  onSwitchToEdit?: () => void
}

function getTrustIcon(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case 'package':
      return <PackageCheck className="w-4 h-4 text-[#8C7E6A]" />
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-[#8C7E6A]" />
    case 'shield':
      return <ShieldCheck className="w-4 h-4 text-[#8C7E6A]" />
    case 'truck':
      return <Truck className="w-4 h-4 text-[#8C7E6A]" />
    case 'award':
      return <Award className="w-4 h-4 text-[#8C7E6A]" />
    case 'heart':
      return <Heart className="w-4 h-4 text-[#8C7E6A]" />
    case 'refresh':
      return <RotateCcw className="w-4 h-4 text-[#8C7E6A]" />
    default:
      return <CheckCircle2 className="w-4 h-4 text-[#8C7E6A]" />
  }
}

export function ProductStorefrontPreview({
  product,
  images,
  categories,
  categoryId,
  exchangeRate = 25000,
  trustBadges,
  trustBadgesEnabled = true,
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

  // Price calculations
  const priceVND = product.priceVND || 0
  const salePriceVND = product.salePriceVND
  const hasDiscount = salePriceVND !== null && salePriceVND !== undefined && salePriceVND < priceVND

  const displayPrice =
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

  const discountPercent =
    hasDiscount && priceVND > 0
      ? Math.round(((priceVND - salePriceVND!) / priceVND) * 100)
      : 0

  const activeImages = images && images.length > 0 ? images : ['/assets/logo.svg']
  const currentImage = activeImages[selectedImageIndex] || activeImages[0]

  // Default badges if none from API
  const defaultBadges = [
    {
      id: 'default-1',
      icon: 'package',
      titleVi: 'Đóng gói chống vỡ 100%',
      titleEn: 'Breakage-Safe Packing',
      isVisible: true,
    },
    {
      id: 'default-2',
      icon: 'sparkles',
      titleVi: 'Gốm thủ công nghệ nhân',
      titleEn: 'Artisan Handcrafted',
      isVisible: true,
    },
    {
      id: 'default-3',
      icon: 'shield',
      titleVi: 'Đồng kiểm khi nhận',
      titleEn: 'Inspection on Delivery',
      isVisible: true,
    },
  ]

  const activeBadges = (trustBadges && trustBadges.length > 0 ? trustBadges : defaultBadges).filter(
    (b) => b.isVisible,
  )

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] text-[#2C2620] overflow-y-auto">
      {/* Simulation Controls Bar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-[#4A4238] uppercase tracking-wider">
            Storefront Simulation Mode (100% Khách Hàng)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center rounded-sm border border-stone-300 bg-stone-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPreviewLocale('vi')}
              className={`rounded-xs px-2.5 py-1 font-semibold transition-colors ${
                previewLocale === 'vi'
                  ? 'bg-white text-[#4A4238] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tiếng Việt (VI)
            </button>
            <button
              type="button"
              onClick={() => setPreviewLocale('en')}
              className={`rounded-xs px-2.5 py-1 font-semibold transition-colors ${
                previewLocale === 'en'
                  ? 'bg-white text-[#4A4238] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              English (EN)
            </button>
          </div>

          {/* Live Storefront Link */}
          {product.slug && (
            <a
              href={`/${previewLocale}/shop/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-sm border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span>Xem link thật</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="rounded-sm bg-[#4A4238] px-3 py-1 text-xs font-medium text-white hover:bg-[#8C7E6A] transition-colors"
            >
              Quay lại Form sửa
            </button>
          )}
        </div>
      </div>

      {/* Identical Storefront Container */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-stone-100 rounded-sm border border-stone-200/80 shadow-xs">
              <Image
                src={getImageUrl(currentImage)}
                alt={name}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-all duration-300"
                priority
              />

              {hasDiscount && (
                <div className="absolute top-4 left-4 rounded-xs bg-[#8C7E6A] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs">
                  -{discountPercent}%
                </div>
              )}

              {/* Navigation arrows if multiple images */}
              {activeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev === 0 ? activeImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-stone-700 rounded-full shadow-xs transition-colors"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-stone-700 rounded-full shadow-xs transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {activeImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xs border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#4A4238] shadow-xs'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
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

          {/* Right Column: Product Detail & Purchase Information */}
          <div className="lg:col-span-5 space-y-6">
            {/* Category and Handcrafted Emblem */}
            <div className="flex items-center justify-between text-xs tracking-wider uppercase text-stone-500">
              <span>{categoryName}</span>
              <span className="font-mono text-[10px] text-[#8C7E6A]">ƯƠM. ARCHIVE</span>
            </div>

            {/* Product Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#2C2620] leading-tight">
              {name}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-serif text-xl sm:text-2xl font-normal text-[#2C2620]">
                {displayPrice}
              </span>
              {originalPrice && (
                <span className="font-serif text-sm text-stone-400 line-through">
                  {originalPrice}
                </span>
              )}
            </div>

            {/* Poetic Quote / Short Description */}
            {shortDesc && (
              <div className="border-l-2 border-[#8C7E6A] bg-stone-50/60 pl-4 py-2.5 rounded-r-sm">
                <p className="font-serif italic text-sm sm:text-[15px] leading-relaxed text-[#5C5042]">
                  “{shortDesc}”
                </p>
              </div>
            )}

            {/* Structured Specifications Card */}
            {(product.material || product.dimensions) && (
              <div className="relative overflow-hidden rounded-sm border border-[#E8E1D5] bg-gradient-to-b from-[#FCFAF7] to-[#F8F5EE] p-4 sm:p-5 shadow-[0_2px_12px_rgba(74,66,56,0.03)] space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-[#C2B6A3]/60 before:to-transparent">
                <div className="flex items-center pb-3 border-b border-[#ECE4D8]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C7E6A]" />
                    <span className="font-serif text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3D332A]">
                      {previewLocale === 'vi' ? 'Thông số chế tác' : 'Craft Specifications'}
                    </span>
                  </div>
                </div>

                <dl className="divide-y divide-[#EFEAE2] text-xs sm:text-[13px]">
                  {product.material && (
                    <div className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                      <dt className="w-24 sm:w-28 shrink-0 font-serif text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#8C7E6A] font-medium">
                        {previewLocale === 'vi' ? 'Chất liệu' : 'Material'}
                      </dt>
                      <dd className="font-serif font-normal text-xs sm:text-[13px] text-[#2C241D] leading-relaxed flex-1">
                        {product.material}
                      </dd>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                      <dt className="w-24 sm:w-28 shrink-0 font-serif text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#8C7E6A] font-medium">
                        {previewLocale === 'vi' ? 'Kích thước' : 'Dimensions'}
                      </dt>
                      <dd className="font-serif font-normal text-xs sm:text-[13px] text-[#2C241D] leading-relaxed flex-1">
                        {product.dimensions}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Detailed Description */}
            {description && (
              <div className="space-y-2 pt-1">
                <h4 className="font-serif text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3D332A]">
                  {previewLocale === 'vi' ? 'Mô tả tác phẩm' : 'About the piece'}
                </h4>
                <div
                  className="prose prose-stone max-w-none font-serif text-xs sm:text-sm font-normal leading-relaxed text-[#3A332C] [&_p]:leading-[1.75] [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-[#2C2620]"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            )}

            {/* Quick Link - View all products */}
            <div className="pt-2">
              <span className="group inline-flex items-center gap-2.5 font-serif text-xs sm:text-[13px] uppercase tracking-[0.18em] text-[#7A6A55] hover:text-[#2C241D] transition-all duration-300 py-1 cursor-pointer">
                <span className="relative font-medium pb-0.5 border-b border-[#8C7E6A]/35 group-hover:border-[#2C241D] transition-colors duration-300">
                  {previewLocale === 'vi' ? 'Xem tất cả sản phẩm' : 'Explore all pieces'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-[#8C7E6A] group-hover:text-[#2C241D]" />
              </span>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-stone-300 bg-white rounded-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-sans text-xs px-2 min-w-[32px] text-center font-semibold text-[#2C2620]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3.5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className="flex-1 py-3 px-6 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors uppercase tracking-[0.2em] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm rounded-xs cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{previewLocale === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to Cart'}</span>
                </button>
              </div>

              <p className="text-[11px] text-stone-500 font-sans tracking-wide">
                {previewLocale === 'vi'
                  ? '* Đăng nhập tài khoản để lưu giỏ hàng và đồng bộ thanh toán trực tuyến.'
                  : '* Log in to your account to save cart and sync online checkout.'}
              </p>

              {/* Trust Badges */}
              {trustBadgesEnabled && activeBadges.length > 0 && (
                <div
                  className={`grid gap-2 pt-3 border-t border-stone-200/70 text-center ${
                    activeBadges.length === 1
                      ? 'grid-cols-1'
                      : activeBadges.length === 2
                        ? 'grid-cols-2'
                        : activeBadges.length === 3
                          ? 'grid-cols-3'
                          : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {activeBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xs bg-[#FBF9F5] border border-stone-200/50"
                    >
                      {getTrustIcon(badge.icon)}
                      <span className="font-sans text-[10px] sm:text-[11px] font-medium text-[#4A4238] leading-tight">
                        {previewLocale === 'vi' ? badge.titleVi : badge.titleEn}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Inquiry Section */}
            {product.inquiryEnabled !== false && (
              <div className="space-y-4 pt-4 border-t border-stone-200/50">
                <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
                  {previewLocale === 'vi' ? 'Yêu cầu đặt hàng' : 'Order Inquiry'}
                </h4>
                <div className="flex max-w-sm flex-col gap-2.5">
                  <div className="group flex w-full items-center justify-between gap-4 border border-stone-300 bg-white px-5 py-3 transition-colors hover:border-[#4A4238]">
                    <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
                      Instagram
                    </span>
                    <Instagram className="h-4 w-4 text-[#4A4238]" />
                  </div>
                  <div className="group flex w-full items-center justify-between gap-4 border border-stone-300 bg-white px-5 py-3 transition-colors hover:border-[#4A4238]">
                    <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
                      Facebook
                    </span>
                    <Facebook className="h-4 w-4 text-[#4A4238]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
