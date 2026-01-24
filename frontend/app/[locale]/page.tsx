'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { useBanners } from '@/hooks/use-banners'
import { useCategories } from '@/hooks/use-categories'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProducts } from '@/hooks/use-products'
import { useSiteContent } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

function usePremiumSmoothScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const startX = useRef(0)
  const scrollLeft = useRef(0)
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
    scrollLeft.current = scrollRef.current.scrollLeft
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
      scrollRef.current.scrollLeft = scrollLeft.current - walk
      
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

  return {
    scrollRef,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onClickCapture: handleCaptureClick,
    isDragging,
    progress
  }
}

export default function HomePage() {
  const t = useTranslations('Home')
  const locale = useLocale() as 'vi' | 'en'

  useDocumentTitle('', 'Ươm.')

  const { data: latestProducts, isLoading: isLoadingLatest } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data: featuredProducts, isLoading: isLoadingFeatured } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    isFeatured: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const latestDrag = usePremiumSmoothScroll()
  const featuredDrag = usePremiumSmoothScroll()

  const { data: banners, isLoading: isLoadingBanners } = useBanners(true)

  return (
    <div className="pt-0 overflow-hidden">
      {/* Hero Banner Section */}
      <section className="w-full">
        {isLoadingBanners ? (
          <div className="aspect-[4/5] w-full animate-pulse bg-muted/20 md:aspect-[21/9] lg:aspect-[3/1]" />
        ) : (
          <BannerCarousel banners={banners || []} locale={locale} />
        )}
      </section>

      {/* Section: New Arrivals */}
      <section className="w-full py-16 pt-24 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex items-end justify-between pb-8 px-6 lg:px-12"
        >
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
              {locale === 'vi' ? 'BST MỚI NHẤT' : 'NEW COLLECTIONS'}
            </h2>
            <p className="font-sans text-2xl font-bold uppercase tracking-[0.1em]">
              {locale === 'vi' ? 'Sản phẩm gợi ý' : 'Suggested for you'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
          >
            <span>{t('viewAll')}</span>
            <div className="h-[1px] w-8 bg-foreground transition-all group-hover:w-12" />
          </Link>
        </motion.div>

        {isLoadingLatest ? (
          <div className="flex gap-6 overflow-hidden px-6 lg:px-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-[85vw] shrink-0 space-y-6 md:w-[45vw] lg:w-[31vw]">
                <div className="aspect-[4/5] animate-pulse bg-muted/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative group/container">
            <div
              ref={latestDrag.scrollRef}
              onMouseDown={latestDrag.onMouseDown}
              onMouseMove={latestDrag.onMouseMove}
              onMouseUp={latestDrag.onMouseUp}
              onMouseLeave={latestDrag.onMouseLeave}
              onClickCapture={latestDrag.onClickCapture}
              className={cn(
                'hide-scrollbar flex select-none gap-6 overflow-x-auto pb-12 transition-transform duration-500 ease-out px-6 lg:px-12',
                latestDrag.isDragging ? 'cursor-grabbing scale-[0.995]' : 'cursor-grab'
              )}
            >
              <AnimatePresence mode="popLayout">
                {latestProducts?.data.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0.01 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[85vw] shrink-0 md:w-[45vw] lg:w-[31vw]"
                  >
                    <ProductCard product={product} locale={locale} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      {/* Section: JOURNAL */}
      <section className="w-full py-24 bg-white border-t border-foreground/[0.03]">
        <div className="mb-16 flex items-end justify-between pb-8 px-6 lg:px-12">
           <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
              JOURNAL
            </h2>
            <p className="font-sans text-2xl font-bold uppercase tracking-[0.1em]">
              {locale === 'vi' ? 'Nhật ký & Câu chuyện' : 'Stories & Journal'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop?isFeatured=true`}
            className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]"
          >
            <span>DISCOVER</span>
            <div className="h-[1px] w-8 bg-foreground transition-all group-hover:w-12" />
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="flex gap-6 overflow-hidden px-6 lg:px-12">
             {[...Array(2)].map((_, i) => (
              <div key={i} className="w-[85vw] shrink-0 space-y-6 md:w-[45vw] lg:w-[48vw]">
                <div className="aspect-[4/5] animate-pulse bg-muted/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative group/container">
            <div
              ref={featuredDrag.scrollRef}
              onMouseDown={featuredDrag.onMouseDown}
              onMouseMove={featuredDrag.onMouseMove}
              onMouseUp={featuredDrag.onMouseUp}
              onMouseLeave={featuredDrag.onMouseLeave}
              onClickCapture={featuredDrag.onClickCapture}
              className={cn(
                'hide-scrollbar flex select-none gap-6 overflow-x-auto pb-12 transition-transform duration-500 ease-out px-6 lg:px-12',
                featuredDrag.isDragging ? 'cursor-grabbing scale-[0.995]' : 'cursor-grab'
              )}
            >
              <AnimatePresence mode="popLayout">
                {featuredProducts?.data.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0.01 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[85vw] shrink-0 md:w-[45vw] lg:w-[48vw]"
                  >
                    <ProductCard product={product} locale={locale} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      <div className="py-20" />
    </div>
  )
}
