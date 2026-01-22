'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/hooks/use-products'
import { useSiteContent } from '@/hooks/use-settings'
import { useBanners } from '@/hooks/use-banners'
import { ProductCard } from '@/components/ProductCard'
import { BannerCarousel } from '@/components/BannerCarousel'

export default function HomePage() {
  const t = useTranslations('Home')
  const locale = useLocale() as 'vi' | 'en'
  
  // Fetch global settings/content
  const { data: siteContent } = useSiteContent()
  const { data: banners } = useBanners(true)
  const heroImage = siteContent?.[`hero.image.${locale}`] || siteContent?.['hero.image.en']
  
  // Fetch latest products
  const { data: latestProducts, isLoading: isLoadingLatest } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // Fetch featured/curated products
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useProducts({
    page: 1,
    limit: 8,
    isActive: true,
    isFeatured: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  return (
    <div className="pt-0">
      {/* Hero Banner Carousel - Full Width */}
      {banners && banners.length > 0 ? (
        <div>
          <BannerCarousel banners={banners} locale={locale} />
        </div>
      ) : (
        /* Fallback Hero Section if no banners */
        <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
          {/* Background Image with Parallax/Zoom effect */}
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage}
                alt="Hero Background"
                fill
                className="object-cover animate-slow-zoom"
                priority
              />
              <div className="absolute inset-0 bg-black/30" /> {/* Overlay */}
            </div>
          )}

          <div className="relative z-10 text-center text-white animate-fade-in space-y-6 max-w-4xl px-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl uppercase tracking-[0.2em] font-light drop-shadow-lg">
              {siteContent?.[`hero.title.${locale}`] || t('title')}
            </h1>
            <p className="text-lg md:text-xl font-light tracking-wide leading-relaxed max-w-2xl mx-auto drop-shadow-md opacity-90">
              {siteContent?.[`hero.subtitle.${locale}`] || t('subtitle')}
            </p>
            <div className="pt-8">
              <Link 
                href={`/${locale}/shop`} 
                className="btn border-white text-white hover:bg-white hover:text-black transition-all duration-500 min-w-[200px]"
              >
                {t('explore')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-16 pt-16 md:pt-24">
        <div className="flex justify-between items-center mb-12">
          <h2 className="uppercase tracking-wider">{t('featured')}</h2>
          <Link href={`/${locale}/shop`} className="nav-link">
            {t('viewAll')}
          </Link>
        </div>

        {isLoadingLatest ? (
          <div className="grid-products">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-product bg-muted/30 animate-pulse" />
                <div className="h-4 bg-muted/30 animate-pulse w-3/4" />
                <div className="h-4 bg-muted/30 animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-products stagger-children">
            {latestProducts?.data.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* Curated Selection Section (Replacing Philosophy) */}
      <section className="w-full px-6 md:px-12 lg:px-16 py-12 md:py-16 border-t border-border/10">
        <div className="flex justify-between items-center mb-12">
          <h2 className="uppercase tracking-wider">{t('curated')}</h2>
          <Link href={`/${locale}/shop?isFeatured=true`} className="nav-link">
            {t('showMore')}
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="grid-products">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-product bg-muted/30 animate-pulse" />
                <div className="h-4 bg-muted/30 animate-pulse w-3/4" />
                <div className="h-4 bg-muted/30 animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-products stagger-children">
            {featuredProducts?.data.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
