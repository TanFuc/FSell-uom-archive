'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useProducts } from '@/hooks/use-products'
import { ArrowRight } from 'lucide-react'
import { optimizeProductImage } from '@/lib/utils'

export default function HomePage() {
  const locale = useLocale()
  const t = useTranslations('Home')
  const { data: productsData } = useProducts({ limit: 4 })

  return (
    <>
      {/* Hero Section */}
      <section className="section-sm md:section min-h-[60vh] md:min-h-[80vh] flex items-center justify-center">
        <div className="container-custom text-center stagger-children">
          <h1 className="text-2xl md:text-3xl lg:text-4xl uppercase tracking-[0.2em] mb-6">
            {t('title')}
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-8 md:mb-12">
            {t('subtitle')}
          </p>
          <Link href={`/${locale}/shop`} className="btn">
            {t('explore')}
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      {productsData?.items && productsData.items.length > 0 && (
        <section className="section bg-muted/20">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-12 md:mb-16">
              <h2 className="uppercase tracking-wider">{t('featured')}</h2>
              <Link href={`/${locale}/shop`} className="nav-link flex items-center gap-2">
                {t('viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid-products-simple">
              {productsData.items.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/shop/${product.slug}`}
                  className="group block animate-fade-in"
                >
                  <div className="relative w-full bg-muted/30 overflow-hidden mb-4 rounded-sm" style={{ aspectRatio: '4 / 5' }}>
                    {product.images[0] && (
                      <Image
                        src={optimizeProductImage(product.images[0])}
                        alt={locale === 'vi' ? product.nameVi : product.nameEn}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="transition-transform duration-500 group-hover:scale-105"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem] group-hover:italic transition-all">
                      {locale === 'vi' ? product.nameVi : product.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground font-light">
                      {product.priceVND.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="uppercase tracking-wider mb-8">{t('philosophy')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('philosophyText')}
            </p>
            <Link href={`/${locale}/about`} className="btn-ghost mt-8 inline-flex items-center gap-2">
              {t('learnMore')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
