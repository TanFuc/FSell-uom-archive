'use client'

import { type UseQueryResult } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useEffect, useCallback } from 'react'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { useBanners } from '@/hooks/use-banners'
import { useProducts } from '@/hooks/use-products'
import { useSiteContent } from '@/hooks/use-settings'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY, type StoryItem } from '@/lib/stories'
import { type Banner, type PaginatedResponse, type Product, type SiteContent } from '@/lib/types'
import { cn, optimizeProductImage } from '@/lib/utils'

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
  const isPointerDown = useRef(false)
  const hasMovedWhilePointerDown = useRef(false)

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
    if (!scrollRef.current || e.button !== 0) return
    isPointerDown.current = true
    hasMovedWhilePointerDown.current = false
    setIsDragging(false)
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    dragDistance.current = 0

    velocity.current = 0
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current)

    lastX.current = e.pageX
    lastTime.current = Date.now()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPointerDown.current || !scrollRef.current) return
    e.preventDefault()

    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.6
    const prevScroll = scrollRef.current.scrollLeft
    scrollRef.current.scrollLeft = scrollLeft.current - walk

    dragDistance.current += Math.abs(scrollRef.current.scrollLeft - prevScroll)
    if (!hasMovedWhilePointerDown.current && dragDistance.current > 3) {
      hasMovedWhilePointerDown.current = true
      setIsDragging(true)
    }

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
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    if (maxScroll > 0) {
      setProgress(scrollRef.current.scrollLeft / maxScroll)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isPointerDown.current && !isDragging) return
    isPointerDown.current = false
    setIsDragging(false)
    if (hasMovedWhilePointerDown.current && Math.abs(velocity.current) > 1) {
      animationFrame.current = requestAnimationFrame(step)
    }
    hasMovedWhilePointerDown.current = false
  }, [isDragging, step])

  const handleCaptureClick = useCallback((e: React.MouseEvent) => {
    if (dragDistance.current > 15) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    const onWindowMouseUp = () => {
      handleMouseUp()
    }

    window.addEventListener('mouseup', onWindowMouseUp)
    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp)
    }
  }, [handleMouseUp])

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
    onDragStart: handleDragStart,
    onClickCapture: handleCaptureClick,
    onScroll: handleScroll,
    isDragging,
    progress,
  }
}

export default function HomeClient({
  initialProducts,
  initialSiteContent,
  initialBanners,
}: {
  initialProducts?: PaginatedResponse<Product>
  initialSiteContent?: SiteContent
  initialBanners?: Banner[]
}) {
  const t = useTranslations('Home')
  const tNav = useTranslations('Navigation')
  const locale = useLocale() as 'vi' | 'en'
  const storyCta = locale === 'vi' ? 'Doc story' : 'Read story'
  const homepageLinks =
    locale === 'vi'
      ? [
          {
            title: 'Sản phẩm',
            description: 'Khám phá các món gốm thủ công đang có tại ƯƠM.',
            href: `/${locale}/shop`,
          },
          {
            title: 'Tạp chí',
            description: 'Đọc câu chuyện về chất liệu, nghệ nhân và không gian sống.',
            href: `/${locale}/journal`,
          },
          {
            title: 'Về chúng tôi',
            description: 'Tìm hiểu triết lý tuyển chọn và câu chuyện của ƯƠM.',
            href: `/${locale}/about`,
          },
          {
            title: 'Liên hệ',
            description: 'Gửi yêu cầu tư vấn hoặc đặt hàng qua các kênh của ƯƠM.',
            href: `/${locale}/about#contact`,
          },
        ]
      : [
          {
            title: 'Shop',
            description: 'Explore handcrafted ceramic pieces curated by UOM.',
            href: `/${locale}/shop`,
          },
          {
            title: 'Journal',
            description: 'Read stories about materials, artisans, and living spaces.',
            href: `/${locale}/journal`,
          },
          {
            title: 'About Us',
            description: 'Learn about the curation philosophy and story behind UOM.',
            href: `/${locale}/about`,
          },
          {
            title: 'Contact',
            description: 'Send an inquiry or order request through UOM channels.',
            href: `/${locale}/about#contact`,
          },
        ]

  const { data: latestProducts, isLoading: isLoadingLatest } = useProducts(
    {
      page: 1,
      limit: 8,
      isActive: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    { initialData: initialProducts },
  ) as UseQueryResult<PaginatedResponse<Product>>

  const { data: siteContent, isLoading: isLoadingStories } = useSiteContent({
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    initialData: initialSiteContent,
  }) as UseQueryResult<SiteContent>
  const stories = parseStories(siteContent?.[STORIES_CONTENT_KEY]).filter(
    (story) => story.isVisible !== false,
  )

  const latestDrag = usePremiumSmoothScroll()
  const featuredDrag = usePremiumSmoothScroll()

  const { data: banners, isLoading: isLoadingBanners } = useBanners(true, {
    initialData: initialBanners,
  }) as UseQueryResult<Banner[]>

  return (
    <div className="safe-screen pt-0">
      {/* Hero Banner Section */}
      <section className="w-full">
        {isLoadingBanners ? (
          <div className="aspect-[4/5] w-full animate-pulse bg-muted/20 md:aspect-[21/9] lg:aspect-[3/1]" />
        ) : (
          <BannerCarousel banners={banners ?? []} locale={locale} />
        )}
      </section>

      {/* Section: New Arrivals */}
      <section className="w-full bg-white py-16 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex flex-wrap items-end justify-between gap-4 px-4 pb-8 sm:px-6 lg:px-12"
        >
          <div className="min-w-0 space-y-3">
            <h2 className="text-mobile-safe text-[8px] font-bold uppercase tracking-[0.28em] text-foreground/40 sm:tracking-[0.4em]">
              {locale === 'vi' ? 'BST MỚI NHẤT' : 'NEW COLLECTIONS'}
            </h2>
            <p className="text-mobile-safe font-sans text-lg font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em]">
              {locale === 'vi' ? 'Sản phẩm gợi ý' : 'Suggested for you'}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="group flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] transition-colors hover:opacity-60"
          >
            <span>{t('showMore')}</span>
            <span className="sr-only">{tNav('shop')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>

        {isLoadingLatest ? (
          <div className="flex gap-6 overflow-hidden px-4 sm:px-6 lg:px-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc(100vw-32px)] max-w-full shrink-0 space-y-6 sm:w-[calc(100vw-64px)] md:w-[45vw] lg:w-[31vw]"
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
              onDragStart={latestDrag.onDragStart}
              onClickCapture={latestDrag.onClickCapture}
              onScroll={latestDrag.onScroll}
              className={cn(
                'hide-scrollbar flex w-full select-none gap-6 overflow-x-auto overscroll-x-contain px-4 pb-12 transition-transform duration-500 ease-out sm:px-6 lg:px-12',
                latestDrag.isDragging ? 'scale-[0.995] cursor-grabbing' : 'cursor-grab',
              )}
            >
              <AnimatePresence mode="popLayout">
                {latestProducts?.data.map((product: Product, idx: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[calc(100vw-32px)] max-w-full shrink-0 sm:w-[calc(100vw-64px)] md:w-[45vw] lg:w-[31vw]"
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
        <div className="mb-16 flex flex-wrap items-end justify-between gap-4 px-4 pb-8 sm:px-6 lg:px-12">
          <div className="min-w-0 space-y-3">
            <h2 className="text-mobile-safe text-[9px] font-bold uppercase tracking-[0.28em] text-foreground/40 sm:tracking-[0.35em] md:text-[10px]">
              JOURNAL
            </h2>
            <p className="text-mobile-safe font-sans text-base font-bold uppercase tracking-[0.08em] md:text-lg md:tracking-[0.1em]">
              {locale === 'vi' ? 'Nhật ký & Câu chuyện' : 'Stories & Journal'}
            </p>
          </div>
          <Link
            href={`/${locale}/journal`}
            className="group flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] transition-colors hover:opacity-60 md:text-[10px]"
          >
            <span>{t('showMore')}</span>
            <span className="sr-only">{tNav('journal')}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {isLoadingStories ? (
          <div className="flex gap-6 overflow-hidden px-4 sm:px-6 lg:px-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="w-[calc(100vw-32px)] max-w-full shrink-0 space-y-6 sm:w-[calc(100vw-64px)] md:w-[45vw] lg:w-[calc(50vw-48px)]"
              >
                <div className="overflow-hidden rounded-xl border border-foreground/5">
                  <div className="aspect-[4/5] animate-pulse bg-muted/20" />
                  <div className="space-y-3 p-4 md:p-5">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted/20" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted/10" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="px-4 text-sm text-foreground/50 sm:px-6 lg:px-12">
            {locale === 'vi'
              ? 'Stories đang được cập nhật. Xem lại sau nhé.'
              : 'Stories are being updated. Please check back soon.'}
          </div>
        ) : (
          <div className="group/container relative">
            <div
              ref={featuredDrag.scrollRef}
              onMouseDown={featuredDrag.onMouseDown}
              onMouseMove={featuredDrag.onMouseMove}
              onMouseUp={featuredDrag.onMouseUp}
              onMouseLeave={featuredDrag.onMouseLeave}
              onDragStart={featuredDrag.onDragStart}
              onClickCapture={featuredDrag.onClickCapture}
              onScroll={featuredDrag.onScroll}
              className={cn(
                'hide-scrollbar flex w-full select-none gap-6 overflow-x-auto overscroll-x-contain px-4 pb-12 transition-transform duration-500 ease-out sm:px-6 lg:px-12',
                featuredDrag.isDragging ? 'scale-[0.995] cursor-grabbing' : 'cursor-grab',
              )}
            >
              <AnimatePresence mode="popLayout">
                {stories.map((story: StoryItem, idx: number) => (
                  <motion.div
                    key={story.id}
                    initial={false}
                    className="w-[calc(100vw-32px)] max-w-full shrink-0 sm:w-[calc(100vw-64px)] md:w-[45vw] lg:w-[calc(50vw-48px)]"
                  >
                    <Link
                      href={`/${locale}/journal/${encodeURIComponent(getStorySlug(story, locale))}`}
                      className="block"
                    >
                      <article className="group overflow-hidden rounded-xl border border-foreground/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image
                            src={optimizeProductImage(story.imageUrl, {
                              width: 1200,
                              height: 1500,
                            })}
                            alt={locale === 'vi' ? story.titleVi : story.titleEn}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                            priority={idx < 2}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                          {story.publishedAt && (
                            <p className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground/70 backdrop-blur-sm md:text-[10px]">
                              {story.publishedAt}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2 p-4 md:p-5">
                          <h3 className="line-clamp-2 min-h-[2.4rem] font-sans text-sm font-semibold uppercase leading-tight tracking-[0.08em] text-foreground transition-colors group-hover:text-foreground/85 md:min-h-[2.8rem] md:text-base">
                            {locale === 'vi' ? story.titleVi : story.titleEn}
                          </h3>
                          <p className="line-clamp-3 text-[10px] leading-relaxed tracking-[0.04em] text-foreground/65 md:text-xs">
                            {locale === 'vi' ? story.summaryVi : story.summaryEn}
                          </p>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-foreground/55">
                            {storyCta}
                          </span>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      <section className="w-full border-t border-foreground/[0.04] bg-[#f8f6f2] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-mobile-safe text-[9px] font-bold uppercase tracking-[0.28em] text-foreground/40 sm:tracking-[0.35em] md:text-[10px]">
                {locale === 'vi' ? 'KHÁM PHÁ ƯƠM' : 'EXPLORE UOM'}
              </h2>
              <p className="text-mobile-safe font-sans text-base font-bold uppercase tracking-[0.08em] md:text-lg md:tracking-[0.1em]">
                {locale === 'vi' ? 'Các trang trong website' : 'Pages in this website'}
              </p>
            </div>
          </div>

          <nav aria-label={locale === 'vi' ? 'Các trang trong website' : 'Website pages'}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {homepageLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block rounded-md border border-foreground/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-foreground/25 hover:shadow-sm"
                >
                  <span className="text-mobile-safe block font-sans text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-3 block text-xs leading-relaxed text-foreground/60">
                    {item.description}
                  </span>
                  <span className="mt-5 inline-block text-[9px] font-semibold uppercase tracking-[0.24em] text-foreground/45 transition group-hover:text-foreground">
                    {t('showMore')}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <div className="py-20" />
    </div>
  )
}
