'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-categories'
import { useSiteContent } from '@/hooks/use-settings'
import { useBanners } from '@/hooks/use-banners'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ProductCard } from '@/components/ProductCard'
import { BannerCarousel } from '@/components/BannerCarousel'

export default function HomePage() {
  const t = useTranslations('Home')
  const locale = useLocale() as 'vi' | 'en'
  
  // Update document title - just use the brand name for home page
  useDocumentTitle('', 'Ươm Archive')
  
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

  // Fetch categories
  const { data: categories } = useCategories({ includeInactive: false })

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
        <section className="relative h-[60vh] md:h-[80vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
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

          <div className="relative z-10 text-center text-white animate-fade-in space-y-4 md:space-y-6 max-w-4xl px-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl uppercase tracking-[0.2em] font-light drop-shadow-lg">
              {siteContent?.[`hero.title.${locale}`] || t('title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-light tracking-wide leading-relaxed max-w-2xl mx-auto drop-shadow-md opacity-90 hidden sm:block">
              {siteContent?.[`hero.subtitle.${locale}`] || t('subtitle')}
            </p>
            <div className="pt-6 md:pt-8">
              <Link 
                href={`/${locale}/shop`} 
                className="btn border-white text-white hover:bg-white hover:text-black transition-all duration-500 min-w-[160px] md:min-w-[200px] text-sm md:text-base"
              >
                {t('explore')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="w-full px-4 md:px-12 lg:px-16 py-12 md:py-16 pt-12 md:pt-24">
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <h2 className="uppercase tracking-wider text-sm md:text-base">{t('featured')}</h2>
          <Link href={`/${locale}/shop`} className="nav-link text-xs md:text-sm">
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

      {/* Categories Selection */}
      {categories && categories.length > 0 && (
        <section className="w-full px-4 md:px-12 lg:px-16 py-12 md:py-16 bg-[#F8F5F2]/50 border-y border-border/10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="uppercase tracking-[0.3em] font-light text-xl md:text-2xl mb-4">Shop by Category</h2>
            <div className="w-24 h-px bg-primary mx-auto opacity-30" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-12 max-w-7xl mx-auto">
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/${locale}/shop?categoryId=${category.id}`}
                className="group flex flex-col items-center"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-full mb-4 md:mb-6 border border-border/10 bg-white p-2">
                  <div className="relative w-full h-full overflow-hidden rounded-full">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={locale === 'vi' ? category.nameVi : category.nameEn}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <span className="text-xl md:text-2xl font-serif text-muted-foreground/30">
                          { (locale === 'vi' ? category.nameVi : category.nameEn).charAt(0) }
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-black/5 ring-inset group-hover:bg-black/5 transition-all duration-300" />
                </div>
                <h3 className="uppercase tracking-widest text-xs md:text-sm font-medium group-hover:text-primary transition-colors text-center">
                  {locale === 'vi' ? category.nameVi : category.nameEn}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

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
