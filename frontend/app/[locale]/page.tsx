'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { useBanners } from '@/hooks/use-banners'
import { useCategories } from '@/hooks/use-categories'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProducts } from '@/hooks/use-products'
import { useSiteContent } from '@/hooks/use-settings'

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
        <section className="relative flex h-[60vh] min-h-[400px] w-full items-center justify-center overflow-hidden md:h-[80vh]">
          {/* Background Image with Parallax/Zoom effect */}
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage}
                alt="Hero Background"
                fill
                className="animate-slow-zoom object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/30" /> {/* Overlay */}
            </div>
          )}

          <div className="animate-fade-in relative z-10 max-w-4xl space-y-4 px-6 text-center text-white md:space-y-6">
            <h1 className="text-3xl font-light uppercase tracking-[0.2em] drop-shadow-lg sm:text-4xl md:text-6xl lg:text-7xl">
              {siteContent?.[`hero.title.${locale}`] || t('title')}
            </h1>
            <p className="mx-auto hidden max-w-2xl text-base font-light leading-relaxed tracking-wide opacity-90 drop-shadow-md sm:block sm:text-lg md:text-xl">
              {siteContent?.[`hero.subtitle.${locale}`] || t('subtitle')}
            </p>
            <div className="pt-6 md:pt-8">
              <Link
                href={`/${locale}/shop`}
                className="btn min-w-[160px] border-white text-sm text-white transition-all duration-500 hover:bg-white hover:text-black md:min-w-[200px] md:text-base"
              >
                {t('explore')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="w-full px-4 py-12 pt-12 md:px-12 md:py-16 md:pt-24 lg:px-16">
        <div className="mb-8 flex items-center justify-between md:mb-12">
          <h2 className="text-sm uppercase tracking-wider md:text-base">{t('featured')}</h2>
          <Link href={`/${locale}/shop`} className="nav-link text-xs md:text-sm">
            {t('viewAll')}
          </Link>
        </div>

        {isLoadingLatest ? (
          <div className="grid-products">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-product animate-pulse bg-muted/30" />
                <div className="h-4 w-3/4 animate-pulse bg-muted/30" />
                <div className="h-4 w-1/2 animate-pulse bg-muted/30" />
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
        <section className="w-full border-y border-border/10 bg-[#F8F5F2]/50 px-4 py-12 md:px-12 md:py-16 lg:px-16">
          <div className="mb-10 text-center md:mb-16">
            <h2 className="mb-4 text-xl font-light uppercase tracking-[0.3em] md:text-2xl">
              Shop by Category
            </h2>
            <div className="mx-auto h-px w-24 bg-primary opacity-30" />
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-4 lg:gap-12">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/shop?categoryId=${category.id}`}
                className="group flex flex-col items-center"
              >
                <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-full border border-border/10 bg-white p-2 md:mb-6">
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={locale === 'vi' ? category.nameVi : category.nameEn}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/50">
                        <span className="font-serif text-xl text-muted-foreground/30 md:text-2xl">
                          {(locale === 'vi' ? category.nameVi : category.nameEn).charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 transition-all duration-300 group-hover:bg-black/5" />
                </div>
                <h3 className="text-center text-xs font-medium uppercase tracking-widest transition-colors group-hover:text-primary md:text-sm">
                  {locale === 'vi' ? category.nameVi : category.nameEn}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Curated Selection Section (Replacing Philosophy) */}
      <section className="w-full border-t border-border/10 px-6 py-12 md:px-12 md:py-16 lg:px-16">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="uppercase tracking-wider">{t('curated')}</h2>
          <Link href={`/${locale}/shop?isFeatured=true`} className="nav-link">
            {t('showMore')}
          </Link>
        </div>

        {isLoadingFeatured ? (
          <div className="grid-products">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-product animate-pulse bg-muted/30" />
                <div className="h-4 w-3/4 animate-pulse bg-muted/30" />
                <div className="h-4 w-1/2 animate-pulse bg-muted/30" />
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
