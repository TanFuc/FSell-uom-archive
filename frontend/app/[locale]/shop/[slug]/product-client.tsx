'use client'

import { Instagram, Facebook, Loader2, ArrowLeft, Info, Search, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useBanners } from '@/hooks/use-banners'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import { optimizeProductImage, cn, formatPriceVND } from '@/lib/utils'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

interface ProductPageProps {
  params: {
    slug: string
  }
}

// Reusable Hook for Drag Scroll
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
        const newVelocity = -dx / dt * 18
        velocity.current = velocity.current * 0.2 + newVelocity * 0.8
      }
      lastX.current = e.pageX
      lastTime.current = now
    },
    [isDragging]
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

export default function ProductClient({ params }: ProductPageProps) {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const tHome = useTranslations('Home')
  const { data: product, isLoading, error } = useProduct(params.slug)
  const { data: socialLinks } = useSocialLinks()
  const { data: banners } = useBanners(true)

  const { data: relatedProducts } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // Hook for Related Products
  const relatedDrag = useDragScroll()

  // Hook for Image Carousel (Mouse Drag)
  const imageDrag = useDragScroll()
  // Custom Cursor Logic
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)
  const [isHoveringImage, setIsHoveringImage] = useState(false)

  const handleMouseMoveCursor = useCallback((e: React.MouseEvent) => {
    cursorX.set(e.clientX)
    cursorY.set(e.clientY)
  }, [cursorX, cursorY])

  const scrollImage = useCallback((direction: 'left' | 'right') => {
    if (!imageDrag.scrollRef.current) return
    const scrollAmount = imageDrag.scrollRef.current.clientWidth
    const targetScroll = direction === 'left'
      ? imageDrag.scrollRef.current.scrollLeft - scrollAmount
      : imageDrag.scrollRef.current.scrollLeft + scrollAmount

    imageDrag.scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }, [imageDrag.scrollRef])

  const name = product ? (locale === 'vi' ? product.nameVi : product.nameEn) : t('loading')

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn
  const priceDisplay = getDisplayPrice(product, locale)

  return (
    <div className="w-full">
      {/* Header padding for fixed header */}
      <div className="h-16 lg:h-20" />

      {/* Floating Left-Side Back Navigation (Desktop Only) */}
      <Link
        href={`/${locale}/shop`}
        className="group fixed left-0 top-0 z-50 hidden h-full w-24 cursor-pointer items-center justify-center transition-all hover:bg-gradient-to-r hover:from-black/5 lg:flex"
        title={t('back')}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg opacity-0 transition-all duration-300 transform translate-x-[-16px] group-hover:opacity-100 group-hover:translate-x-[12px]">
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
        <div className="px-6 lg:px-12">
          {/* Back Button - Arrow only */}
          {/* Back Button (Mobile/Tablet Only) */}
          <Link
            href={`/${locale}/shop`}
            className="mb-6 inline-flex items-center transition-all hover:translate-x-[-4px] pt-8 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Main Product Layout: Image Vertical Stack + Sticky Info */}
          <div className="grid grid-cols-1 gap-0 md:gap-12 md:grid-cols-[1fr_400px] lg:grid-cols-[55vw_400px] lg:gap-32 justify-center">
            {/* 1. Left Column: Vertical Image Stack (Desktop) / Carousel (Mobile) */}
            <div className="relative w-full pb-0 md:max-w-[700px] md:pb-24">
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
                    onMouseDown={(e) => { imageDrag.onMouseDown(e) }}
                    onMouseMove={(e) => { imageDrag.onMouseMove(e); handleMouseMoveCursor(e) }}
                    onMouseUp={(e) => { imageDrag.onMouseUp() }}
                    onMouseLeave={(e) => { imageDrag.onMouseLeave(); setIsHoveringImage(false) }}
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onClickCapture={imageDrag.onClickCapture}
                    className={cn(
                      "flex w-[calc(100%+48px)] -ml-6 snap-x snap-mandatory gap-0 overflow-x-auto pb-0 hide-scrollbar md:w-full md:ml-0 md:flex-col md:gap-12 md:px-0 lg:cursor-none",
                      imageDrag.isDragging ? 'cursor-grabbing' : 'cursor-grab lg:cursor-none'
                    )}
                  >
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-full aspect-[3/4] h-auto shrink-0 snap-center overflow-hidden bg-muted/10 md:h-auto md:w-full md:hover:shadow-xl rounded-sm"
                      >
                        <Image
                          src={optimizeProductImage(image, { width: 1200, height: 1600 })}
                          alt={`${name} - ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 60vw"
                          className="object-cover object-center md:h-full md:w-full"
                          priority={index < 4}
                          draggable="false"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center bg-muted/20 text-[10px] uppercase tracking-widest text-foreground/30">
                  {t('noImages')}
                </div>
              )}
            </div>

            {/* 2. Right Column: Sticky Product Details */}
            <div className="relative px-0 md:px-0">
               <div className="md:sticky md:top-32 space-y-4 md:space-y-12 pb-12 md:pb-24 pt-10 md:pt-0">
                {/* Info Header */}
                <div className="space-y-2 mb-8">
                  <h1 className="font-sans text-[10px] font-bold uppercase leading-tight tracking-[0.2em] text-foreground">
                    {name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <p className="font-sans text-[10px] font-medium tracking-wide text-foreground">
                      {priceDisplay.currentPrice}
                    </p>
                    {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                      <p className="text-[10px] font-light text-foreground/30 line-through">
                        {priceDisplay.originalPrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                    DETAILS
                  </h4>
                  
                  {/* Technical Specs List */}
                  <div className="flex flex-col gap-1 text-[10px] font-normal text-foreground leading-relaxed">
                     {product.dimensions && <p>Height: {product.dimensions}</p>}
                     {product.material && <p>Material: {product.material}</p>}
                  </div>

                  {/* HTML Description */}
                  <div 
                    className="prose prose-sm max-w-none text-[10px] font-normal text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description || '' }}
                  />
                  
                  {/* Caring & Warranty Link (Placeholder flavor) */}
                  <p className="text-[10px] text-foreground/70 mt-2 cursor-pointer hover:underline">(Caring & Warranty)</p>
                </div>

                {/* Inquiry Buttons */}
                <div className="space-y-8 pt-8">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">
                    Order Inquiry
                  </h4>
                  <div className="flex flex-col gap-3">
                    {socialLinks?.instagramUsername && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between border border-foreground/10 px-6 py-4 transition-all duration-300 hover:bg-foreground hover:text-white"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
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
                        className="group flex items-center justify-between border border-foreground/10 px-6 py-4 transition-all duration-300 hover:bg-foreground hover:text-white"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
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
      <section className="w-full py-24 px-6 lg:px-12 bg-white">
        <div className="mb-16 flex items-end justify-between">
          <div className="space-y-3">
            <h2 className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/40">
              {locale === 'vi' ? 'CÓ THỂ BẠN THÍCH' : 'YOU MAY ALSO LIKE'}
            </h2>
            <p className="font-sans text-lg font-bold uppercase tracking-[0.1em]">
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

        <div className="relative group/container">
          <div
            ref={relatedDrag.scrollRef}
            onMouseDown={relatedDrag.onMouseDown}
            onMouseMove={relatedDrag.onMouseMove}
            onMouseUp={relatedDrag.onMouseUp}
            onMouseLeave={relatedDrag.onMouseLeave}
            onClickCapture={relatedDrag.onClickCapture}
            className={cn(
              'hide-scrollbar flex select-none gap-6 overflow-x-auto pb-12 transition-transform duration-500 ease-out -mx-6 px-4 w-[calc(100%+48px)] lg:mx-0 lg:px-0 lg:w-full',
              relatedDrag.isDragging ? 'cursor-grabbing scale-[0.995]' : 'cursor-grab'
            )}
          >
            <AnimatePresence mode="popLayout">
              {relatedProducts?.data
                ?.filter((p) => p.id !== product.id)
                .map((item, idx) => (
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
    </div>
  )
}
