'use client'

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Instagram, Facebook, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Plus, Minus, ShieldCheck, PackageCheck, Sparkles, Truck, Award, Heart, RotateCcw, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ProductCard } from '@/components/ProductCard'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { NetworkErrorState } from '@/components/ui/network-error-state'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useExchangeRate, useSocialLinks, useTrustBadges } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import { type Product } from '@/lib/types'
import { optimizeProductImage, cn } from '@/lib/utils'
import ProductImageLightbox from '@/components/ProductImageLightbox'
import { api } from '@/lib/api'
import { useCustomerStore } from '@/lib/customer-store'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface ProductPageProps {
  params: {
    slug: string
  }
  initialProduct?: Product | null
}

type VariantInfo = {
  cleanText: string
  groups: Array<{
    label: string
    values: string[]
  }>
}

type VariantGroupPayload = {
  labelVi?: string
  labelEn?: string
  valuesVi?: string[]
  valuesEn?: string[]
}

const VARIANT_GROUPS_PREFIX = '[[VARIANT_GROUPS]]'

function parseVariantSummary(raw: string | undefined, locale: 'vi' | 'en'): VariantInfo {
  if (!raw) {
    return { cleanText: '', groups: [] }
  }

  const normalizeValues = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const lines = raw.split('\n')
  const cleanLines: string[] = []
  let parsedGroups: VariantGroupPayload[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith(VARIANT_GROUPS_PREFIX)) {
      try {
        const json = trimmed.slice(VARIANT_GROUPS_PREFIX.length)
        const parsed = JSON.parse(json)
        if (Array.isArray(parsed)) {
          parsedGroups = parsed
        }
      } catch {
        cleanLines.push(line)
      }
    } else {
      cleanLines.push(line)
    }
  }

  const cleanText = cleanLines.join('\n').trim()

  if (parsedGroups.length > 0) {
    const groups = parsedGroups
      .map((group) => {
        const label = locale === 'vi' ? group.labelVi || '' : group.labelEn || ''
        const values = locale === 'vi' ? group.valuesVi || [] : group.valuesEn || []
        const normalized = values.map((value) => String(value).trim()).filter(Boolean)
        return {
          label: label.trim(),
          values: Array.from(new Set(normalized)),
        }
      })
      .filter((group) => group.label && group.values.length > 0)

    return {
      cleanText,
      groups,
    }
  }

  const fallbackGroups: Array<{ label: string; values: string[] }> = []
  const cleanParts: string[] = []

  const segments = cleanText
    .split('\n')
    .flatMap((line) => line.split('|'))
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    const match = segment.match(/^([A-Za-z\s]+?)(?:\s*\(\d+\))?\s*:\s*(.+)$/)
    if (!match) {
      cleanParts.push(segment)
      continue
    }

    const key = match[1].toLowerCase().trim()
    const values = normalizeValues(match[2])
    if (values.length === 0) {
      cleanParts.push(segment)
      continue
    }

    if (key === 'types' || key === 'type') {
      fallbackGroups.push({
        label: locale === 'vi' ? 'Loai' : 'Types',
        values: Array.from(new Set(values)),
      })
    } else if (key === 'colors' || key === 'color') {
      fallbackGroups.push({
        label: locale === 'vi' ? 'Mau sac' : 'Colors',
        values: Array.from(new Set(values)),
      })
    } else if (key === 'sizes' || key === 'size') {
      fallbackGroups.push({
        label: locale === 'vi' ? 'Kich co' : 'Sizes',
        values: Array.from(new Set(values)),
      })
    } else {
      cleanParts.push(segment)
    }
  }

  return {
    cleanText: cleanParts.join(' ').trim(),
    groups: fallbackGroups,
  }
}

function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const startX = useRef(0)
  const scrollLeftValue = useRef(0)
  const velocity = useRef(0)
  const animationFrame = useRef<number>()
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const dragDistance = useRef(0)

  const step = useCallback(() => {
    if (!scrollRef.current) return
    if (Math.abs(velocity.current) > 0.1) {
      scrollRef.current.scrollLeft += velocity.current
      velocity.current *= 0.965

      animationFrame.current = requestAnimationFrame(step)
    } else {
      velocity.current = 0
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftValue.current = scrollRef.current.scrollLeft
    dragDistance.current = 0
    velocity.current = 0
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
    lastX.current = e.pageX
    lastTime.current = Date.now()
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return
      e.preventDefault()
      const x = e.pageX - scrollRef.current.offsetLeft
      const walk = (x - startX.current) * 1.6
      const prevScroll = scrollRef.current.scrollLeft
      scrollRef.current.scrollLeft = scrollLeftValue.current - walk
      dragDistance.current += Math.abs(scrollRef.current.scrollLeft - prevScroll)
      const now = Date.now()
      const dt = now - lastTime.current
      const dx = e.pageX - lastX.current
      if (dt > 0) {
        const newVelocity = (-dx / dt) * 18
        velocity.current = velocity.current * 0.2 + newVelocity * 0.8
      }
      lastX.current = e.pageX
      lastTime.current = now
    },
    [isDragging],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (Math.abs(velocity.current) > 1) {
      animationFrame.current = requestAnimationFrame(step)
    }
  }, [step])

  const handleCaptureClick = useCallback((e: React.MouseEvent) => {
    if (dragDistance.current > 15) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
    }
  }, [step])

  return {
    scrollRef,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onClickCapture: handleCaptureClick,
    isDragging,
  }
}

export default function ProductClient({ params, initialProduct }: ProductPageProps) {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('product')
  const tHome = useTranslations('Home')
  const {
    data: product,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useProduct(params.slug, {
    initialData: initialProduct ?? undefined,
  })
  const { data: exchangeRate } = useExchangeRate({ enabled: locale === 'en' })
  const { data: socialLinks } = useSocialLinks()
  const { data: trustBadgesData } = useTrustBadges()

  const { data: relatedProducts } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const relatedDrag = useDragScroll()

  const imageDrag = useDragScroll()

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Customer Cart & Auth integration
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const { isAuthenticated, openAuthModal } = useCustomerStore()

  const handleAddToCart = async (qty = quantity) => {
    if (!product) return

    if (!isAuthenticated) {
      openAuthModal(t('loginToAddToCart'), () => {
        handleAddToCart(qty)
      })
      return
    }

    setAddingToCart(true)
    try {
      await api.addToCart(product.id, qty)
      useCustomerStore.getState().fetchCartCount()
      toast.success(t('addedToCartSuccess'), {
        duration: 2000,
        action: {
          label: t('viewCart'),
          onClick: () => setIsCartDrawerOpen(true),
        },
      })
    } catch (err: any) {
      if (err?.response?.status === 401) {
        openAuthModal(t('sessionExpiredLoginAgain'), () => {
          handleAddToCart(qty)
        })
      } else {
        toast.error(err?.response?.data?.message || t('cannotAddToCart'))
      }
    } finally {
      setAddingToCart(false)
    }
  }

  const handleMouseMoveCursor = useCallback(
    (e: React.MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    },
    [cursorX, cursorY],
  )

  const scrollImage = useCallback(
    (direction: 'left' | 'right') => {
      if (!imageDrag.scrollRef.current) return
      const scrollAmount = imageDrag.scrollRef.current.clientWidth
      const targetScroll =
        direction === 'left'
          ? imageDrag.scrollRef.current.scrollLeft - scrollAmount
          : imageDrag.scrollRef.current.scrollLeft + scrollAmount

      imageDrag.scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    },
    [imageDrag.scrollRef],
  )

  const name = product ? (locale === 'vi' ? product.nameVi : product.nameEn) : t('loading')

  if (isLoading) {
    return <LoadingScreen fullscreen />
  }

  if (error || !product) {
    return <NetworkErrorState compact isRetrying={isFetching} onRetry={() => refetch()} />
  }

  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn
  const shortDescriptionRaw =
    locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn
  const variants = parseVariantSummary(shortDescriptionRaw, locale)
  const shortDescription = variants.cleanText
  const priceDisplay = getDisplayPrice(product, locale, exchangeRate?.rate)
  const faqTitle = locale === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked questions'
  const faqItems =
    locale === 'vi'
      ? [
          {
            question: `${name} phù hợp với không gian nào?`,
            answer:
              'Sản phẩm phù hợp với không gian sống tối giản hoặc góc trưng bày thủ công, tôn bật chất liệu gốm.',
          },
          {
            question: 'Cách bảo quản gốm sứ thủ công?',
            answer:
              'Hạn chế va đập mạnh, vệ sinh nhẹ nhàng bằng khăn mềm và tránh thay đổi nhiệt độ đột ngột.',
          },
          {
            question: 'Làm sao để đặt hàng hoặc tư vấn?',
            answer:
              'Bạn có thể nhắn qua Instagram/Facebook hoặc gửi yêu cầu tư vấn ngay trên trang sản phẩm.',
          },
        ]
      : [
          {
            question: `Where does ${name} fit best?`,
            answer:
              'It complements minimal interiors or curated display corners, highlighting handcrafted ceramic textures.',
          },
          {
            question: 'How should I care for handcrafted ceramics?',
            answer:
              'Avoid heavy impact, clean gently with a soft cloth, and keep away from sudden temperature changes.',
          },
          {
            question: 'How can I inquire or place an order?',
            answer:
              'Message us via Instagram/Facebook or send an inquiry directly on the product page.',
          },
        ]
  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* Header padding for fixed header */}
      <div className="h-20 lg:h-28" />

      {/* Floating Left-Side Back Navigation (Desktop Only) */}
      <Link
        href={`/${locale}/shop`}
        className="group fixed left-0 top-0 z-50 hidden h-full w-24 cursor-pointer items-center justify-center transition-all hover:bg-gradient-to-r hover:from-black/5 lg:flex"
        title={t('back')}
        aria-label={t('back')}
      >
        <div className="flex h-12 w-12 translate-x-[-16px] transform items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-[12px] group-hover:opacity-100">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </div>
      </Link>

      {/* Custom Cursor Overlay */}
      <AnimatePresence>
        {isHoveringImage && lightboxIndex === null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              translateX: cursorXSpring,
              translateY: cursorYSpring,
              left: -40,
              top: -40,
            }}
            className="pointer-events-none fixed z-[100] hidden h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/20 text-[10px] font-bold tracking-widest text-white backdrop-blur-md lg:flex"
          >
            VIEW
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full bg-white pb-24">
        <div className="px-4 sm:px-6 lg:px-12">
          {/* Back Button - Arrow only */}
          {/* Back Button (Mobile/Tablet Only) */}
          <Link
            href={`/${locale}/shop`}
            className="mb-4 inline-flex items-center pt-2 transition-all hover:translate-x-[-4px] lg:hidden"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Main Product Layout: Image Vertical Stack + Sticky Info */}
          <div className="grid min-w-0 grid-cols-1 justify-center gap-0 md:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] md:gap-12 lg:grid-cols-[minmax(0,55vw)_400px] lg:gap-32">
            {/* 1. Left Column: Vertical Image Stack (Desktop) / Carousel (Mobile) */}
            <div className="relative w-full min-w-0 pb-0 md:max-w-[700px] md:pb-24">
              {product.images && product.images.length > 0 ? (
                <>
                  {/* Mobile Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => scrollImage('left')}
                        className="absolute bottom-4 left-4 z-10 p-2 text-white drop-shadow-md transition-all active:scale-95 md:hidden"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => scrollImage('right')}
                        className="absolute bottom-4 right-4 z-10 p-2 text-white drop-shadow-md transition-all active:scale-95 md:hidden"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <div
                    ref={imageDrag.scrollRef}
                    onMouseDown={(e) => {
                      imageDrag.onMouseDown(e)
                    }}
                    onMouseMove={(e) => {
                      imageDrag.onMouseMove(e)
                      handleMouseMoveCursor(e)
                    }}
                    onMouseUp={() => {
                      imageDrag.onMouseUp()
                    }}
                    onMouseLeave={() => {
                      imageDrag.onMouseLeave()
                      setIsHoveringImage(false)
                    }}
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onClickCapture={imageDrag.onClickCapture}
                    className={cn(
                      'hide-scrollbar -mx-4 flex w-[calc(100%+32px)] snap-x snap-mandatory gap-0 overflow-x-auto pb-0 sm:-mx-6 sm:w-[calc(100%+48px)] md:mx-0 md:w-full md:flex-col md:gap-12 md:px-0 lg:cursor-none',
                      imageDrag.isDragging ? 'cursor-grabbing' : 'cursor-grab lg:cursor-none',
                    )}
                  >
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (!imageDrag.isDragging) {
                            setLightboxIndex(index)
                          }
                        }}
                        className="relative aspect-[3/4] h-auto w-full shrink-0 cursor-pointer snap-center overflow-hidden rounded-sm bg-muted/10 md:h-auto md:w-full md:hover:shadow-xl"
                      >
                        <Image
                          src={optimizeProductImage(image, { width: 1200, height: 1600 })}
                          alt={`${name} - Ceramic Archive Piece ${index + 1} - ƯƠM. Archive`}
                          fill
                          sizes="(max-width: 768px) 100vw, 700px"
                          quality={index === 0 ? 78 : 70}
                          className="object-cover object-center md:h-full md:w-full"
                          priority={index === 0}
                          fetchPriority={index === 0 ? 'high' : 'auto'}
                          draggable="false"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-muted/20 text-[10px] uppercase tracking-widest text-foreground/30">
                  {t('noImages')}
                </div>
              )}
            </div>

            {/* 2. Right Column: Sticky Product Details */}
            <div className="relative min-w-0 px-0 md:px-0">
              <div className="md:sticky md:top-24 md:self-start lg:top-28">
                <div className="w-full space-y-6 pb-12 pt-6 md:space-y-8 md:pb-0 md:pt-0">
                  {/* Info Header */}
                  <div className="space-y-3">
                    <h1 className="text-mobile-safe font-sans text-xl sm:text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-[#4A4238]">
                      {name}
                    </h1>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p
                        className={cn(
                          'font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-tight',
                          priceDisplay.hasDiscount ? 'text-[#991b1b]' : 'text-[#4A4238]',
                        )}
                      >
                        {priceDisplay.currentPrice}
                      </p>
                      {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                        <>
                          <p className="font-sans text-sm sm:text-base font-normal text-muted-foreground/60 line-through">
                            {priceDisplay.originalPrice}
                          </p>
                          {priceDisplay.discountPercentage && (
                            <span className="rounded-xs bg-[#991b1b] px-2 py-0.5 font-sans text-xs font-semibold tracking-wide text-white">
                              −{priceDisplay.discountPercentage}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-5">
                    {/* Poetic quote / Short summary */}
                    {shortDescription ? (
                      <div className="border-l-2 border-[#8C7E6A] bg-stone-50/60 pl-4 py-2 rounded-r-sm">
                        <p className="font-serif italic text-sm sm:text-[15px] leading-relaxed text-[#5C5042]">
                          “{shortDescription}”
                        </p>
                      </div>
                    ) : null}

                    {/* Structured Specifications Form / Card */}
                    {(product.material || product.dimensions || variants.groups.length > 0) && (
                      <div className="relative overflow-hidden rounded-sm border border-[#E8E1D5] bg-gradient-to-b from-[#FCFAF7] to-[#F8F5EE] p-4 sm:p-5 shadow-[0_2px_12px_rgba(74,66,56,0.03)] space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-[#C2B6A3]/60 before:to-transparent">
                        <div className="flex items-center justify-between pb-3 border-b border-[#ECE4D8]">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7E6A]" />
                            <span className="font-serif text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3D332A]">
                              {locale === 'vi' ? 'Thông số chế tác' : 'Craft Specifications'}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 font-serif text-[10px] sm:text-[11px] uppercase font-medium text-[#7A6A55] tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-white/80 border border-[#DCD3C5] shadow-xs">
                            <Sparkles className="w-2.5 h-2.5 text-[#8C7E6A]" />
                            {locale === 'vi' ? 'Thủ công độc bản' : 'Unique Handcraft'}
                          </span>
                        </div>

                        <dl className="divide-y divide-[#EFEAE2] text-xs sm:text-[13px]">
                          {product.material && (
                            <div className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                              <dt className="w-24 sm:w-28 shrink-0 font-serif text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#8C7E6A] font-medium">
                                {locale === 'vi' ? 'Chất liệu' : 'Material'}
                              </dt>
                              <dd className="font-serif font-normal text-xs sm:text-[13px] text-[#2C241D] leading-relaxed flex-1">
                                {product.material}
                              </dd>
                            </div>
                          )}
                          {product.dimensions && (
                            <div className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                              <dt className="w-24 sm:w-28 shrink-0 font-serif text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#8C7E6A] font-medium">
                                {locale === 'vi' ? 'Kích thước' : 'Dimensions'}
                              </dt>
                              <dd className="font-serif font-normal text-xs sm:text-[13px] text-[#2C241D] leading-relaxed flex-1">
                                {product.dimensions}
                              </dd>
                            </div>
                          )}
                          {variants.groups.map((group) => (
                            <div key={group.label} className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                              <dt className="w-24 sm:w-28 shrink-0 font-serif text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#8C7E6A] font-medium">
                                {group.label}
                              </dt>
                              <dd className="font-serif font-normal text-xs sm:text-[13px] text-[#2C241D] leading-relaxed flex-1">
                                {group.values.join(', ')}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    {/* Detailed Description */}
                    {description && (
                      <div className="space-y-2 pt-1">
                        <h4 className="font-serif text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#3D332A]">
                          {locale === 'vi' ? 'Mô tả tác phẩm' : 'About this piece'}
                        </h4>
                        <div
                          className="prose prose-stone max-w-none overflow-hidden font-serif text-xs sm:text-sm font-normal leading-relaxed text-[#3A332C] [overflow-wrap:anywhere] [&_p]:leading-[1.75] [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-[#2C2620] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[#3A332C] [&_li]:leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      </div>
                    )}

                    {/* Explore all products CTA */}
                    <div className="pt-2">
                      <Link
                        href={`/${locale}/shop`}
                        className="group inline-flex items-center gap-2.5 font-serif text-xs sm:text-[13px] uppercase tracking-[0.18em] text-[#7A6A55] hover:text-[#2C241D] transition-all duration-300 py-1"
                      >
                        <span className="relative font-medium pb-0.5 border-b border-[#8C7E6A]/35 group-hover:border-[#2C241D] transition-colors duration-300">
                          {t('viewAllProducts')}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-[#8C7E6A] group-hover:text-[#2C241D]" />
                      </Link>
                    </div>
                  </div>

                  {/* Add to Cart Section - Enforcing Login */}
                  <div className="space-y-4 pt-6 border-t border-stone-200">
                    <div className="flex items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-stone-300 bg-white rounded-xs">
                        <button
                          type="button"
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          className="px-3.5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors"
                          aria-label={t('decreaseQuantity')}
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
                          aria-label={t('increaseQuantity')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(quantity)}
                        disabled={addingToCart}
                        className="flex-1 py-3 px-6 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors uppercase tracking-[0.2em] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 rounded-xs"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{addingToCart ? t('addingToCart') : t('addToCart')}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-500 font-sans tracking-wide">
                      {t('cartLoginNotice')}
                    </p>

                    {/* Trust & Craft Guarantee Badges (Dynamic from Admin) */}
                    {trustBadgesData?.enabled !== false && (() => {
                      const fallbackBadges = [
                        { id: '1', icon: 'package', titleVi: 'Đóng gói chống vỡ 100%', titleEn: 'Breakage-Safe Packing', isVisible: true },
                        { id: '2', icon: 'sparkles', titleVi: 'Gốm thủ công nghệ nhân', titleEn: 'Artisan Handcrafted', isVisible: true },
                        { id: '3', icon: 'shield', titleVi: 'Đồng kiểm khi nhận', titleEn: 'Inspection on Delivery', isVisible: true },
                      ]
                      const badgesToDisplay = (trustBadgesData?.items || fallbackBadges).filter((b: any) => b.isVisible)
                      if (badgesToDisplay.length === 0) return null

                      const renderIcon = (iconName: string) => {
                        switch (iconName?.toLowerCase()) {
                          case 'package': return <PackageCheck className="w-4 h-4 text-[#8C7E6A]" />
                          case 'sparkles': return <Sparkles className="w-4 h-4 text-[#8C7E6A]" />
                          case 'shield': return <ShieldCheck className="w-4 h-4 text-[#8C7E6A]" />
                          case 'truck': return <Truck className="w-4 h-4 text-[#8C7E6A]" />
                          case 'award': return <Award className="w-4 h-4 text-[#8C7E6A]" />
                          case 'heart': return <Heart className="w-4 h-4 text-[#8C7E6A]" />
                          case 'refresh': return <RotateCcw className="w-4 h-4 text-[#8C7E6A]" />
                          default: return <CheckCircle2 className="w-4 h-4 text-[#8C7E6A]" />
                        }
                      }

                      return (
                        <div className={`grid gap-2 pt-3 border-t border-stone-200/70 text-center ${
                          badgesToDisplay.length === 1
                            ? 'grid-cols-1'
                            : badgesToDisplay.length === 2
                              ? 'grid-cols-2'
                              : badgesToDisplay.length === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2 sm:grid-cols-4'
                        }`}>
                          {badgesToDisplay.map((badge: any) => (
                            <div
                              key={badge.id}
                              className="flex flex-col items-center gap-1.5 p-2 rounded-xs bg-[#FBF9F5] border border-stone-200/50"
                            >
                              {renderIcon(badge.icon)}
                              <span className="font-sans text-[10px] sm:text-[11px] font-medium text-[#4A4238] leading-tight">
                                {locale === 'vi' ? badge.titleVi : badge.titleEn}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Inquiry Buttons */}
                  <div className="space-y-4 pt-4">
                    <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
                      {t('orderInquiry')}
                    </h4>
                    <div className="flex max-w-sm flex-col gap-2.5">
                      {socialLinks?.instagramUsername && (
                        <a
                          href={`https://instagram.com/${socialLinks.instagramUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex w-full items-center justify-between gap-4 border border-foreground/15 bg-white px-5 py-3.5 transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-white"
                          aria-label="Instagram Inquiry"
                        >
                          <span className="min-w-0 font-sans text-xs font-semibold uppercase tracking-[0.15em]">
                            Instagram
                          </span>
                          <Instagram className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        </a>
                      )}
                      {socialLinks?.facebookPageUrl && (
                        <a
                          href={socialLinks.facebookPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex w-full items-center justify-between gap-4 border border-foreground/15 bg-white px-5 py-3.5 transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-white"
                          aria-label="Facebook Inquiry"
                        >
                          <span className="min-w-0 font-sans text-xs font-semibold uppercase tracking-[0.15em]">
                            Facebook
                          </span>
                          <Facebook className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <section className="w-full bg-white px-4 py-24 sm:px-6 lg:px-12">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <h2 className="text-mobile-safe text-[8px] font-light uppercase tracking-[0.28em] text-foreground/40 sm:tracking-[0.4em]">
              {locale === 'vi' ? 'CÓ THỂ BẠN THÍCH' : 'YOU MAY ALSO LIKE'}
            </h2>
            <p className="text-mobile-safe font-serif text-lg sm:text-xl font-normal uppercase tracking-[0.08em] sm:tracking-[0.1em] text-[#4A4238]">
              {locale === 'vi' ? 'Sản phẩm tương tự' : 'Related pieces'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:text-[#8C7E6A]"
          >
            <span>{tHome('viewAll')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="group/container relative">
          <div
            ref={relatedDrag.scrollRef}
            onMouseDown={relatedDrag.onMouseDown}
            onMouseMove={relatedDrag.onMouseMove}
            onMouseUp={relatedDrag.onMouseUp}
            onMouseLeave={relatedDrag.onMouseLeave}
            onClickCapture={relatedDrag.onClickCapture}
            className={cn(
              'hide-scrollbar -mx-4 flex w-[calc(100%+32px)] select-none gap-6 overflow-x-auto px-4 pb-12 transition-transform duration-500 ease-out sm:-mx-6 sm:w-[calc(100%+48px)] lg:mx-0 lg:w-full lg:px-0',
              relatedDrag.isDragging ? 'scale-[0.995] cursor-grabbing' : 'cursor-grab',
            )}
          >
            <AnimatePresence mode="popLayout">
              {relatedProducts?.data
                ?.filter((p: Product) => p.id !== product.id)
                .map((item: Product, idx: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[70vw] shrink-0 md:w-[45vw] lg:w-[23vw]"
                  >
                    <ProductCard product={item} locale={locale} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-4 pb-24 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 shadow-sm sm:p-8">
          <h2 className="text-mobile-safe text-center font-serif text-sm sm:text-base font-normal uppercase tracking-[0.15em] text-[#4A4238]">
            {faqTitle}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question} className="space-y-3">
                <h3 className="font-serif text-sm sm:text-base font-normal tracking-normal text-[#4A4238]">
                  {item.question}
                </h3>
                <p className="text-xs leading-relaxed text-stone-600 font-thin">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal with Zoom / Pan / Navigation */}
      {product?.images && (
        <ProductImageLightbox
          images={product.images}
          initialIndex={lightboxIndex ?? 0}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          productName={name}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />
    </div>
  )
}
