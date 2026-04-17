'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Banner as BannerType } from '@/lib/types'
import { optimizeProductImage } from '@/lib/utils'

interface BannerCarouselProps {
  banners: BannerType[]
  locale: 'vi' | 'en'
  autoPlayInterval?: number // milliseconds
}

export function BannerCarousel({ banners, locale, autoPlayInterval = 5000 }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const shouldPreventClick = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

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

    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [sortedBanners.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + sortedBanners.length) % sortedBanners.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
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

  const currentBanner = sortedBanners[currentIndex]
  const title = locale === 'vi' ? currentBanner.titleVi : currentBanner.titleEn
  const subtitle = locale === 'vi' ? currentBanner.subtitleVi : currentBanner.subtitleEn
  const description = locale === 'vi' ? currentBanner.descriptionVi : currentBanner.descriptionEn

  const BannerContent = () => (
    <>
      {/* Background Image - Hero Style */}
      <div className="relative aspect-[4/5] w-full md:aspect-[21/9] lg:aspect-[3/1]">
        <Image
          src={optimizeProductImage(currentBanner.imageUrl)}
          alt={title || 'Banner'}
          fill
          className="object-cover transition-transform duration-300"
          priority
          draggable={false}
        />

        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/30" />

        {/* Text Content - Positioned at bottom left */}
        {(title || subtitle || description) && (
          <div className="absolute inset-0 flex items-end px-6 pb-12 md:px-16 md:pb-16 lg:px-24 lg:pb-20">
            <div
              className="animate-fade-in max-w-3xl space-y-3 md:space-y-3"
              style={{ color: currentBanner.textColor || '#FFFFFF' }}
            >
              {title && (
                <h2 className="text-3xl font-light uppercase leading-tight tracking-[0.15em] sm:text-4xl md:text-5xl lg:text-6xl">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs font-light uppercase tracking-[0.25em] opacity-90 md:text-sm">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="line-clamp-3 max-w-2xl pt-2 text-sm font-light opacity-80 md:line-clamp-none md:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div
      ref={containerRef}
      className="group relative w-full select-none overflow-hidden"
      style={{ overscrollBehaviorX: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Clickable Content Area */}
      {currentBanner.link ? (
        <Link
          href={currentBanner.link}
          className="block h-full w-full"
          onClick={handleLinkClick}
          draggable={false}
        >
          <BannerContent />
        </Link>
      ) : (
        <div className="h-full w-full">
          <BannerContent />
        </div>
      )}

      {/* Slim line indicators at bottom edge */}
      {sortedBanners.length > 1 && (
        <div className="absolute bottom-0 left-0 flex w-full">
          {sortedBanners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToSlide(index)
              }}
              className="group/bar relative h-[3px] flex-1 overflow-hidden bg-white/25 transition-colors hover:bg-white/40"
              aria-label={`Go to banner ${index + 1}`}
            >
              {index === currentIndex && (
                <span
                  className="absolute inset-y-0 left-0 w-full origin-left bg-white"
                  style={{
                    animation: isAutoPlaying
                      ? `slideProgress ${autoPlayInterval}ms linear forwards`
                      : 'none',
                    transform: isAutoPlaying ? undefined : 'scaleX(1)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
