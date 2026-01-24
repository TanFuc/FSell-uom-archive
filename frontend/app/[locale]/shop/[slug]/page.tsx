'use client'

import { Instagram, Facebook, Loader2, ArrowLeft, Info, Search, X, Menu } from 'lucide-react'
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
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import { optimizeProductImage, cn, formatPriceVND } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  
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
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      if (maxScroll > 0) {
        setProgress(scrollRef.current.scrollLeft / maxScroll)
      }
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
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      if (maxScroll > 0) {
        setProgress(scrollRef.current.scrollLeft / maxScroll)
      }
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
  }, [])

  const name = product ? (locale === 'vi' ? product.nameVi : product.nameEn) : t('loading')
  useDocumentTitle(name)

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

      <div className="w-full bg-white pb-24">
        <div className="px-6 lg:px-12">
          {/* Back Button - Arrow only */}
          <Link
            href={`/${locale}/shop`}
            className="mb-8 inline-flex items-center transition-all hover:translate-x-[-4px] pt-8 md:mb-12"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Main Product Layout: Image Vertical Stack + Sticky Info */}
          <div className="grid gap-12 md:grid-cols-[1fr_400px] lg:grid-cols-[55vw_400px] lg:gap-32 justify-center">
            {/* 1. Left Column: Vertical Image Stack */}
            <div className="max-w-[700px] w-full pb-24">
              {product.images && product.images.length > 0 ? (
                <div className="flex flex-col gap-12">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative w-full overflow-hidden bg-muted/10 transition-all duration-700 hover:shadow-xl"
                      style={{ aspectRatio: '3 / 4' }}
                    >
                      <Image
                        src={optimizeProductImage(image, { width: 1200, height: 1600 })}
                        alt={`${name} - ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-cover object-center"
                        priority={index === 0}
                        draggable="false"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center bg-muted/20 text-[10px] uppercase tracking-widest text-foreground/30">
                  {t('noImages')}
                </div>
              )}
            </div>

            {/* 2. Right Column: Sticky Product Details */}
            <div className="relative">
               <div className="md:sticky md:top-32 space-y-12 pb-24">
                {/* Info Header */}
                <div className="space-y-6">
                  <h1 className="font-sans text-2xl font-bold uppercase leading-tight tracking-[0.1em] text-foreground lg:text-3xl">
                    {name}
                  </h1>
                  <div className="flex items-center gap-4 pb-8">
                    <p className="font-sans text-xl font-medium text-foreground">
                      {priceDisplay.currentPrice}
                    </p>
                    {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                      <p className="text-sm font-light text-foreground/30 line-through">
                        {priceDisplay.originalPrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dimensions & Material */}
                <div className="grid grid-cols-2 gap-8 pb-8">
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">
                      {t('material')}
                    </h4>
                    <p className="text-[11px] uppercase tracking-[0.1em] font-medium">{product.material || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">
                      {t('dimensions')}
                    </h4>
                    <p className="text-[11px] uppercase tracking-[0.1em] font-medium">{product.dimensions || 'N/A'}</p>
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-6">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/30">
                    Description
                  </h4>
                  <div 
                    className="prose prose-sm max-w-none text-[11px] leading-loose text-foreground/60 uppercase tracking-[0.1em]"
                    dangerouslySetInnerHTML={{ __html: description || '' }}
                  />
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
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
              {locale === 'vi' ? 'CÓ THỂ BẠN THÍCH' : 'YOU MAY ALSO LIKE'}
            </h2>
            <p className="font-sans text-2xl font-bold uppercase tracking-[0.1em]">
              {locale === 'vi' ? 'Sản phẩm tương tự' : 'Related pieces'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]"
          >
            <span>{tHome('viewAll')}</span>
            <div className="h-[1px] w-8 bg-foreground transition-all group-hover:w-12" />
          </Link>
        </div>

        <div className="relative group/container">
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClickCapture={handleCaptureClick}
            className={cn(
              'hide-scrollbar flex select-none gap-6 overflow-x-auto pb-12 transition-transform duration-500 ease-out',
              isDragging ? 'cursor-grabbing scale-[0.995]' : 'cursor-grab'
            )}
          >
            <AnimatePresence mode="popLayout">
              {relatedProducts?.data
                ?.filter((p) => p.id !== product.id)
                .map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[85vw] shrink-0 md:w-[40vw] lg:w-[22vw]"
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
