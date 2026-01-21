'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/hooks/use-products'
import { ProductCard } from '@/components/ProductCard'

export default function HomePage() {
  const t = useTranslations('Home')
  const locale = useLocale() as 'vi' | 'en'
  
  // Fetch first 4 products for featured section
  const { data: productsData, isLoading } = useProducts({
    page: 1,
    limit: 4,
    isActive: true,
  })

  return (
    <div className="spacing-xl">
      {/* Hero Section */}
      <section className="container-custom text-center animate-fade-in">
        <h1 className="text-3xl md:text-4xl uppercase tracking-[0.3em] mb-6">
          {t('title')}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
          {t('subtitle')}
        </p>
        <Link href={`/${locale}/shop`} className="btn btn-primary">
          {t('explore')}
        </Link>
      </section>

      {/* Featured Products */}
      <section className="container-custom spacing-md">
        <div className="flex justify-between items-center mb-12">
          <h2 className="uppercase tracking-wider">{t('featured')}</h2>
          <Link href={`/${locale}/shop`} className="nav-link">
            {t('viewAll')}
          </Link>
        </div>

        {isLoading ? (
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
            {productsData?.items.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {/* Philosophy Section */}
      <section className="bg-muted/20 spacing-md">
        <div className="container-custom py-16 md:py-24 text-center">
          <h2 className="uppercase tracking-wider mb-6">{t('philosophy')}</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
            {t('philosophyText')}
          </p>
          <Link href={`/${locale}/about`} className="nav-link">
            {t('learnMore')}
          </Link>
        </div>
      </section>
    </div>
  )
}
