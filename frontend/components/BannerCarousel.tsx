'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Banner as BannerType } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
    } else if (isRightSwipe) {
      goToPrevious()
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
    } else if (isRightDrag) {
      goToPrevious()
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

  if (sortedBanners.length === 0) return null

  const currentBanner = sortedBanners[currentIndex]
  const title = locale === 'vi' ? currentBanner.titleVi : currentBanner.titleEn
  const subtitle = locale === 'vi' ? currentBanner.subtitleVi : currentBanner.subtitleEn
  const description = locale === 'vi' ? currentBanner.descriptionVi : currentBanner.descriptionEn

  const bannerContent = (
    <div 
      className="relative w-full overflow-hidden select-none"
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
      {/* Background Image - Hero Style */}
      <div className="relative w-full aspect-[4/5] md:aspect-[21/9] lg:aspect-[3/1]">
        <Image
          src={currentBanner.imageUrl}
          alt={title || 'Banner'}
          fill
          className="object-cover transition-transform duration-300"
          priority
          draggable={false}
        />
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60 md:to-black/40" />
        
        {/* Text Content - Positioned at bottom left */}
        {(title || subtitle || description) && (
          <div className="absolute inset-0 flex items-end px-6 md:px-16 lg:px-24 pb-12 md:pb-16 lg:pb-20">
            <div className="max-w-3xl space-y-3 md:space-y-3 animate-fade-in" style={{ color: currentBanner.textColor || '#FFFFFF' }}>
              {title && (
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-[0.15em] font-light leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs md:text-sm uppercase tracking-[0.25em] font-light opacity-90">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-sm md:text-base font-light opacity-80 max-w-2xl pt-2 line-clamp-3 md:line-clamp-none">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation Arrows - Only show if multiple banners */}
        {sortedBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                goToPrevious()
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                goToNext()
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 md:p-3 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </>
        )}

        {/* Improved Indicators/Dots - Only show if multiple banners */}
        {sortedBanners.length > 1 && (
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
            {sortedBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 md:w-10 h-1.5 bg-white shadow-lg'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60 hover:scale-125'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // If banner has a link, wrap in Link component
  if (currentBanner.link) {
    return (
      <Link href={currentBanner.link} className="block group">
        {bannerContent}
      </Link>
    )
  }

  return <div className="group">{bannerContent}</div>
}
