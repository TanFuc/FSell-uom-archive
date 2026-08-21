'use client'

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Instagram, Facebook, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useEffect, useCallback } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useExchangeRate, useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import { type Product } from '@/lib/types'
import { optimizeProductImage, cn } from '@/lib/utils'

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
  const { data: product, isLoading, error } = useProduct(params.slug, {
    initialData: initialProduct ?? undefined,
  })
  const { data: exchangeRate } = useExchangeRate({ enabled: locale === 'en' })
  const { data: socialLinks } = useSocialLinks()

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
    notFound()
  }

  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn
  const shortDescriptionRaw =
    locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn
  const variants = parseVariantSummary(shortDescriptionRaw, locale)
  const shortDescription = variants.cleanText
  const priceDisplay = getDisplayPrice(product, locale, exchangeRate?.rate)
  const journalCta = locale === 'vi' ? 'Xem Journal' : 'Read the journal'
  const shopCta = locale === 'vi' ? 'Xem shop' : 'Visit the shop'
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
    <div className="safe-screen">
      {/* Header padding for fixed header */}
      <div className="h-24 lg:h-28" />

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
        {isHoveringImage && (
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
            className="mb-6 inline-flex items-center pt-8 transition-all hover:translate-x-[-4px] lg:hidden"
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
                        className="relative aspect-[3/4] h-auto w-full shrink-0 snap-center overflow-hidden rounded-sm bg-muted/10 md:h-auto md:w-full md:hover:shadow-xl"
                      >
                        <Image
                          src={optimizeProductImage(image, { width: 1200, height: 1600 })}
                          alt={`${name} - Ceramic Archive Piece ${index + 1} - ƯƠM. Archive`}
                          fill
                          sizes="(max-width: 768px) 100vw, 60vw"
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
              <div className="space-y-4 pb-12 pt-10 md:sticky md:top-32 md:space-y-12 md:pb-24 md:pt-0">
                {/* Info Header */}
                <div className="mb-8 space-y-2">
                  <h1 className="text-mobile-safe font-sans text-[13px] font-bold leading-tight tracking-[0.08em] text-foreground sm:tracking-[0.1em]">
                    {name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <p className="font-sans text-[11px] font-semibold tracking-[0.05em] text-foreground">
                      {priceDisplay.currentPrice}
                    </p>
                    {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                      <p className="text-[11px] font-light text-foreground/30 line-through">
                        {priceDisplay.originalPrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                    {t('details')}
                  </h4>

                  {shortDescription ? (
                    <p className="text-[11px] font-normal leading-relaxed tracking-[0.05em] text-foreground/80">
                      {shortDescription}
                    </p>
                  ) : null}

                  {/* Combined Description & Technical Specs */}
                  <div className="flex flex-col gap-1 text-[11px] font-normal leading-relaxed tracking-[0.05em] text-foreground">
                    {variants.groups.map((group) => (
                      <p key={group.label}>
                        <span className="font-bold uppercase">{group.label}: </span>
                        <span className="text-foreground/80">{group.values.join(', ')}</span>
                      </p>
                    ))}
                  </div>

                  {/* HTML Description */}
                  <div
                    className="prose prose-sm max-w-none overflow-hidden font-sans text-[11px] font-medium tracking-[0.05em] text-foreground [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l [&_blockquote]:border-foreground/30 [&_blockquote]:pl-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: description || '' }}
                  />

                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link
                      href={`/${locale}/journal`}
                      className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground underline decoration-foreground/15 underline-offset-8 transition hover:opacity-70"
                    >
                      {journalCta}
                    </Link>
                    <Link
                      href={`/${locale}/shop`}
                      className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground underline decoration-foreground/15 underline-offset-8 transition hover:opacity-70"
                    >
                      {shopCta}
                    </Link>
                  </div>
                </div>

                {/* Inquiry Buttons */}
                <div className="space-y-8 pt-8">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">
                    {t('orderInquiry')}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {socialLinks?.instagramUsername && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex max-w-full items-center justify-between gap-4 border border-foreground/10 px-4 py-4 transition-all duration-300 hover:bg-foreground hover:text-white sm:px-6"
                        aria-label="Instagram Inquiry"
                      >
                        <span className="min-w-0 text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                          Instagram
                        </span>
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks?.facebookPageUrl && (
                      <a
                        href={socialLinks.facebookPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex max-w-full items-center justify-between gap-4 border border-foreground/10 px-4 py-4 transition-all duration-300 hover:bg-foreground hover:text-white sm:px-6"
                        aria-label="Facebook Inquiry"
                      >
                        <span className="min-w-0 text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                          Facebook
                        </span>
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
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
            <h2 className="text-mobile-safe text-[8px] font-bold uppercase tracking-[0.28em] text-foreground/40 sm:tracking-[0.4em]">
              {locale === 'vi' ? 'CÓ THỂ BẠN THÍCH' : 'YOU MAY ALSO LIKE'}
            </h2>
            <p className="text-mobile-safe font-sans text-lg font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em]">
              {locale === 'vi' ? 'Sản phẩm tương tự' : 'Related pieces'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] transition-colors hover:opacity-60"
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
          <h2 className="text-mobile-safe text-center text-[10px] font-bold uppercase tracking-[0.22em] text-foreground/70 sm:tracking-[0.35em]">
            {faqTitle}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question} className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground">
                  {item.question}
                </h3>
                <p className="text-[11px] leading-relaxed text-foreground/70">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
