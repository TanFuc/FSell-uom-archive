'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const shouldPreventClick = useRef(false)

  // Sort banners by order
  const sortedBanners = [...banners].sort((a, b) => a.order - b.order)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || sortedBanners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, sortedBanners.length, autoPlayInterval])

  // Navigate to specific banner
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }, [])

  // Navigate to next/previous
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

  // Touch/Swipe handlers for mobile
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
      // Small movement, treat as click could happen
      shouldPreventClick.current = false
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  // Mouse drag handlers for desktop (supports both left and right mouse buttons)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Accept both left (0) and right (2) mouse buttons
    if (e.button === 0 || e.button === 2) {
      e.preventDefault() // Prevent default behavior for right-click
      setIsDragging(true)
      setDragStart(e.clientX)
      shouldPreventClick.current = false
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return

    const distance = dragStart - e.clientX
    const isLeftDrag = distance > 50
    const isRightDrag = distance < -50

    if (isLeftDrag) {
      goToNext()
      shouldPreventClick.current = true
    } else if (isRightDrag) {
      goToPrevious()
      shouldPreventClick.current = true
    } else {
      // If movement is very small, we don't prevent click
      shouldPreventClick.current = Math.abs(distance) > 5
    }

    setIsDragging(false)
    setDragStart(0)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setDragStart(0)
  }

  // Prevent context menu when dragging with right mouse button
  const handleContextMenu = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
    }
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
      className="group relative w-full select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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

      {/* Navigation Arrows - Only show if multiple banners */}
      {sortedBanners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation() // Prevent event bubbling
              goToPrevious()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 p-2 opacity-0 backdrop-blur-sm transition-all hover:bg-white/40 hover:opacity-100 group-hover:opacity-100 md:left-8 md:p-3"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 text-white md:h-6 md:w-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation() // Prevent event bubbling
              goToNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 p-2 opacity-0 backdrop-blur-sm transition-all hover:bg-white/40 hover:opacity-100 group-hover:opacity-100 md:right-8 md:p-3"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 text-white md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Improved Indicators/Dots - Only show if multiple banners */}
      {sortedBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm md:bottom-8">
          {sortedBanners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goToSlide(index)
              }}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'h-1.5 w-8 bg-white shadow-lg md:w-10'
                  : 'h-1.5 w-1.5 bg-white/40 hover:scale-125 hover:bg-white/60'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
