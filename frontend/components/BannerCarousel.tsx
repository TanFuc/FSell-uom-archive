'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import type { Banner as BannerType } from '@/lib/types'
import { cn, optimizeProductImage } from '@/lib/utils'

interface BannerCarouselProps {
  banners: BannerType[]
  locale: 'vi' | 'en'
  autoPlayInterval?: number // milliseconds
}

export function BannerCarousel({ banners, locale, autoPlayInterval = 6500 }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const shouldPreventClick = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (sortedBanners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [sortedBanners.length, autoPlayInterval])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    shouldPreventClick.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    if (distance > 50) {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
      shouldPreventClick.current = true
    } else if (distance < -50) {
      setCurrentIndex((prev) => (prev - 1 + sortedBanners.length) % sortedBanners.length)
      shouldPreventClick.current = true
    } else {
      shouldPreventClick.current = false
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (shouldPreventClick.current) {
      e.preventDefault()
    }
  }

  if (sortedBanners.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="group relative h-[82vh] w-full select-none overflow-hidden bg-[#111110] sm:h-[88vh] md:h-[92vh] lg:h-[96vh] xl:h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Scrim Gradient to ensure Navbar icons & logo are always crisp and legible */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/45 via-black/15 to-transparent md:h-44" />

      {/* Banner Slides */}
      {sortedBanners.map((banner, index) => {
        const isActive = index === currentIndex
        const title = locale === 'vi' ? banner.titleVi : banner.titleEn
        const subtitle = locale === 'vi' ? banner.subtitleVi : banner.subtitleEn
        const description = locale === 'vi' ? banner.descriptionVi : banner.descriptionEn
        const textColor = banner.textColor || '#FFFFFF'

        return (
          <div
            key={banner.id || index}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              isActive ? 'pointer-events-auto z-[2] opacity-100' : 'pointer-events-none z-[1] opacity-0',
            )}
          >
            {/* Cinematic Image Frame */}
            <div className="relative h-full w-full overflow-hidden">
              <picture className="absolute inset-0 block h-full w-full">
                {banner.mobileImageUrl && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={optimizeProductImage(banner.mobileImageUrl)}
                  />
                )}
                <motion.img
                  src={optimizeProductImage(banner.imageUrl)}
                  alt={title || 'ƯƠM. Archive Hero Banner'}
                  animate={isActive ? { scale: [1, 1.035] } : { scale: 1 }}
                  transition={{
                    duration: autoPlayInterval / 1000 + 1,
                    ease: 'easeOut',
                  }}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
              </picture>

              {/* Gentle subtle bottom vignette for typography */}
              {(title || subtitle || description) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              )}
            </div>

            {/* Editorial Typography (if present) */}
            {(title || subtitle || description) && (
              <div className="absolute inset-0 z-[3] flex items-end px-6 pb-12 sm:px-10 sm:pb-16 md:px-16 md:pb-20 lg:px-24 lg:pb-24">
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      key={`content-${banner.id || index}`}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="min-w-0 max-w-3xl space-y-2.5 md:space-y-3.5"
                      style={{ color: textColor }}
                    >
                      {subtitle && (
                        <p className="inline-block rounded-full bg-white/10 px-3 py-1 font-sans text-[8px] font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md sm:text-[9px] md:tracking-[0.3em]">
                          {subtitle}
                        </p>
                      )}

                      {title && (
                        <h2 className="font-playfair text-2xl font-normal uppercase leading-[1.12] tracking-[0.06em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl sm:tracking-[0.1em] md:text-5xl lg:text-6xl">
                          {title}
                        </h2>
                      )}

                      {description && (
                        <p className="line-clamp-2 max-w-2xl font-serif text-xs font-light leading-relaxed tracking-[0.02em] text-white/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] md:line-clamp-none md:text-sm lg:text-base">
                          {description}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Clickable Destination Link */}
            {banner.link && (
              <Link
                href={banner.link}
                onClick={handleLinkClick}
                prefetch={false}
                className="absolute inset-0 z-[4]"
                aria-label={title || 'Banner Link'}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
