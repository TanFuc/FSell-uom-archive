'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { useBanners } from '@/hooks/use-banners'
import { useCategories } from '@/hooks/use-categories'
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
        const newVelocity = (-dx / dt) * 18
        velocity.current = velocity.current * 0.2 + newVelocity * 0.8
      }

      lastX.current = e.pageX
      lastTime.current = now

      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
      if (maxScroll > 0) {
        setProgress(scrollRef.current.scrollLeft / maxScroll)
      }
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
  }, [])

  return {
    scrollRef,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onClickCapture: handleCaptureClick,
    isDragging,
    progress,
  }
}

export default function HomeClient() {
  const t = useTranslations('Home')
  const locale = useLocale() as 'vi' | 'en'

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
    <div className="overflow-hidden pt-0">
      {/* Hero Banner Section */}
      <section className="w-full">
        {isLoadingBanners ? (
          <div className="aspect-[4/5] w-full animate-pulse bg-muted/20 md:aspect-[21/9] lg:aspect-[3/1]" />
        ) : (
          <BannerCarousel banners={banners || []} locale={locale} />
        )}
      </section>

      {/* Section: New Arrivals */}
      <section className="w-full bg-white py-16 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex items-end justify-between px-6 pb-8 lg:px-12"
        >
          <div className="space-y-3">
            <h2 className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/40">
              {locale === 'vi' ? 'BST MỚI NHẤT' : 'NEW COLLECTIONS'}
            </h2>
            <p className="font-sans text-lg font-bold uppercase tracking-[0.1em]">
              {locale === 'vi' ? 'Sản phẩm gợi ý' : 'Suggested for you'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] transition-colors hover:opacity-60"
          >
            <span>{t('showMore')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>

        {isLoadingLatest ? (
          <div className="flex gap-6 overflow-hidden px-6 lg:px-12">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-[calc(100vw-64px)] shrink-0 space-y-6 md:w-[45vw] lg:w-[31vw]"
              >
                <div className="aspect-[4/5] animate-pulse bg-muted/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="group/container relative">
            <div
              ref={latestDrag.scrollRef}
              onMouseDown={latestDrag.onMouseDown}
              onMouseMove={latestDrag.onMouseMove}
              onMouseUp={latestDrag.onMouseUp}
              onMouseLeave={latestDrag.onMouseLeave}
              onClickCapture={latestDrag.onClickCapture}
              className={cn(
                'hide-scrollbar flex select-none gap-6 overflow-x-auto px-6 pb-12 transition-transform duration-500 ease-out lg:px-12',
                latestDrag.isDragging ? 'scale-[0.995] cursor-grabbing' : 'cursor-grab',
              )}
            >
              <AnimatePresence mode="popLayout">
                {latestProducts?.data.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[calc(100vw-64px)] shrink-0 md:w-[45vw] lg:w-[31vw]"
                  >
                    <ProductCard product={product} locale={locale} priority={idx === 0} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      {/* Section: JOURNAL */}
      <section className="w-full border-t border-foreground/[0.03] bg-white py-24">
        <div className="mb-16 flex items-end justify-between px-6 pb-8 lg:px-12">
          <div className="space-y-3">
            <h2 className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/40">
              JOURNAL
            </h2>
            <p className="font-sans text-lg font-bold uppercase tracking-[0.1em]">
              {locale === 'vi' ? 'Nhật ký & Câu chuyện' : 'Stories & Journal'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop?isFeatured=true`}
            className="group flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] transition-colors hover:opacity-60"
          >
            <span>{t('showMore')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="flex gap-6 overflow-hidden px-6 lg:px-12">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="w-[calc(100vw-64px)] shrink-0 space-y-6 md:w-[45vw] lg:w-[calc(50vw-48px)]"
              >
                <div className="aspect-[4/5] animate-pulse bg-muted/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="group/container relative">
            <div
              ref={featuredDrag.scrollRef}
              onMouseDown={featuredDrag.onMouseDown}
              onMouseMove={featuredDrag.onMouseMove}
              onMouseUp={featuredDrag.onMouseUp}
              onMouseLeave={featuredDrag.onMouseLeave}
              onClickCapture={featuredDrag.onClickCapture}
              className={cn(
                'hide-scrollbar flex select-none gap-6 overflow-x-auto px-6 pb-12 transition-transform duration-500 ease-out lg:px-12',
                featuredDrag.isDragging ? 'scale-[0.995] cursor-grabbing' : 'cursor-grab',
              )}
            >
              <AnimatePresence mode="popLayout">
                {featuredProducts?.data.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[calc(100vw-64px)] shrink-0 md:w-[45vw] lg:w-[calc(50vw-48px)]"
                  >
                    <ProductCard product={product} locale={locale} priority={idx === 0} />
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
