'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Banner as BannerType } from '@/lib/types'

interface BannerProps {
  banner: BannerType
  locale: 'vi' | 'en'
  className?: string
}

export function Banner({ banner, locale, className = '' }: BannerProps) {
  const title = locale === 'vi' ? banner.titleVi : banner.titleEn
  const subtitle = locale === 'vi' ? banner.subtitleVi : banner.subtitleEn
  const description = locale === 'vi' ? banner.descriptionVi : banner.descriptionEn

  const textAlign = banner.textPosition === 'left' ? 'text-left' : banner.textPosition === 'right' ? 'text-right' : 'text-center'
  const justifyContent = banner.textPosition === 'left' ? 'justify-start' : banner.textPosition === 'right' ? 'justify-end' : 'justify-center'

  const content = (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background Image - Hero Style */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1]">
        <Image
          src={banner.imageUrl}
          alt={title || 'Banner'}
          fill
          className="object-cover"
          priority
        />
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        
        {/* Text Content - Positioned at bottom left like reference */}
        {(title || subtitle || description) && (
          <div className="absolute inset-0 flex items-end px-8 md:px-16 lg:px-24 pb-12 md:pb-16 lg:pb-20">
            <div className="max-w-3xl space-y-2 md:space-y-3" style={{ color: banner.textColor || '#FFFFFF' }}>
              {title && (
                <h2 className="text-3xl md:text-5xl lg:text-6xl uppercase tracking-[0.15em] font-light leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs md:text-sm uppercase tracking-[0.25em] font-light opacity-90">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-sm md:text-base font-light opacity-80 max-w-2xl pt-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // If banner has a link, wrap in Link component
  if (banner.link) {
    return (
      <Link href={banner.link} className="block group">
        {content}
      </Link>
    )
  }

  return content
}

// Banner list component for displaying multiple banners
interface BannerListProps {
  banners: BannerType[]
  locale: 'vi' | 'en'
  className?: string
}

export function BannerList({ banners, locale, className = '' }: BannerListProps) {
  if (!banners || banners.length === 0) return null

  // Sort by order field
  const sortedBanners = [...banners].sort((a, b) => a.order - b.order)

  return (
    <div className={`space-y-0 ${className}`}>
      {sortedBanners.map((banner) => (
        <Banner key={banner.id} banner={banner} locale={locale} />
      ))}
    </div>
  )
}
