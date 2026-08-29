'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Banner as BannerType } from '@/lib/types'
import { cn, optimizeProductImage } from '@/lib/utils'

interface BannerCarouselProps {
  banners: BannerType[]
  locale: 'vi' | 'en'
  autoPlayInterval?: number // milliseconds
}

export function BannerCarousel({ banners, locale, autoPlayInterval = 6000 }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const shouldPreventClick = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!isAutoPlaying || sortedBanners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, sortedBanners.length, autoPlayInterval])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    const resumeTimer = setTimeout(() => setIsAutoPlaying(true), 10000)
    return () => clearTimeout(resumeTimer)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
    setIsAutoPlaying(false)
    const resumeTimer = setTimeout(() => setIsAutoPlaying(true), 10000)
    return () => clearTimeout(resumeTimer)
  }, [sortedBanners.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedBanners.length) % sortedBanners.length)
    setIsAutoPlaying(false)
    const resumeTimer = setTimeout(() => setIsAutoPlaying(true), 10000)
    return () => clearTimeout(resumeTimer)
  }, [sortedBanners.length])

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
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
      shouldPreventClick.current = true
    } else if (isRightSwipe) {
      goToPrevious()
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
      className="group relative w-full select-none overflow-hidden bg-[#111110]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Aspect Ratio Container */}
      <div className="relative aspect-[4/5] w-full max-w-full overflow-hidden sm:aspect-[16/10] md:aspect-[21/9] lg:aspect-[3/1]">
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
                isActive ? 'pointer-events-auto z-10 opacity-100' : 'pointer-events-none z-0 opacity-0',
              )}
            >
              {/* Background Image with Cinematic Ken Burns subtle motion */}
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
                    alt={title || 'Hero Banner'}
                    animate={
                      isActive
                        ? { scale: [1, 1.045] }
                        : { scale: 1 }
                    }
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

                {/* Studio Gradient Overlays: Top dark for header + Bottom vignette for typography */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />
                <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%]" />
              </div>

              {/* Text & Content Layer */}
              {(title || subtitle || description) && (
                <div className="absolute inset-0 flex items-end px-5 pb-12 sm:px-8 sm:pb-16 md:px-16 md:pb-20 lg:px-24 lg:pb-24">
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.div
                        key={`content-${banner.id || index}`}
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 0.85,
                          ease: [0.16, 1, 0.3, 1],
                          staggerChildren: 0.12,
                        }}
                        className="min-w-0 max-w-3xl space-y-3 md:space-y-4"
                        style={{ color: textColor }}
                      >
                        {subtitle && (
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.9, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="inline-block rounded-full bg-white/10 px-3 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md sm:text-[10px] md:tracking-[0.3em]"
                          >
                            {subtitle}
                          </motion.p>
                        )}

                        {title && (
                          <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.75, delay: 0.2 }}
                            className="font-playfair text-2xl font-normal uppercase leading-[1.1] tracking-[0.08em] drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)] sm:text-4xl sm:tracking-[0.14em] md:text-5xl lg:text-6xl"
                          >
                            {title}
                          </motion.h2>
                        )}

                        {description && (
                          <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 0.85, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="line-clamp-2 max-w-2xl font-serif text-xs font-light leading-relaxed tracking-[0.02em] text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:line-clamp-none md:text-sm lg:text-base"
                          >
                            {description}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Clickable Link Anchor if banner has a destination link */}
              {banner.link && (
                <Link
                  href={banner.link}
                  onClick={handleLinkClick}
                  prefetch={false}
                  className="absolute inset-0 z-20"
                  aria-label={title || 'Banner Link'}
                />
              )}
            </div>
          )
        })}

        {/* Floating Left / Right Navigation Buttons */}
        {sortedBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/35 hover:bg-black/60 hover:text-white group-hover:opacity-100 sm:left-6 md:h-12 md:w-12"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/35 hover:bg-black/60 hover:text-white group-hover:opacity-100 sm:right-6 md:h-12 md:w-12"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </>
        )}

        {/* Progress Bar Indicators at bottom edge */}
        {sortedBanners.length > 1 && (
          <div className="absolute bottom-0 left-0 z-30 flex w-full gap-1.5 px-4 pb-3 sm:px-8 sm:pb-4 lg:px-24">
            {sortedBanners.map((_, index) => {
              const isCurrent = index === currentIndex

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    goToSlide(index)
                  }}
                  className="group/indicator relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20 transition-all duration-300 hover:h-[4px] hover:bg-white/40"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {isCurrent ? (
                    <motion.span
                      key={`progress-${currentIndex}-${isAutoPlaying}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: isAutoPlaying ? autoPlayInterval / 1000 : 0.3,
                        ease: isAutoPlaying ? 'linear' : 'easeOut',
                      }}
                      className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    />
                  ) : index < currentIndex ? (
                    <span className="absolute inset-0 rounded-full bg-white/60" />
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
