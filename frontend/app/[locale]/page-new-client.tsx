'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useProducts } from '@/hooks/use-products'
import { optimizeProductImage } from '@/lib/utils'

export default function PageNewClient() {
  const locale = useLocale()
  const t = useTranslations('Home')
  const { data: productsData } = useProducts({ limit: 4 })

  return (
    <>
      <section className="section-sm md:section flex min-h-[60vh] items-center justify-center md:min-h-[80vh]">
        <div className="container-custom stagger-children text-center">
          <h1 className="mb-6 text-2xl uppercase tracking-[0.2em] md:text-3xl lg:text-4xl">
            {t('title')}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground md:mb-12">{t('subtitle')}</p>
          <Link href={`/${locale}/shop`} className="btn">
            {t('explore')}
          </Link>
        </div>
      </section>

      {productsData?.data && productsData.data.length > 0 && (
        <section className="section bg-muted/20">
          <div className="container-custom">
            <div className="mb-12 flex items-center justify-between md:mb-16">
              <h2 className="uppercase tracking-wider">{t('featured')}</h2>
              <Link href={`/${locale}/shop`} className="nav-link flex items-center gap-2">
                {t('viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid-products-simple">
              {productsData.data.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/${locale}/shop/${product.slug}`}
                  className="animate-fade-in group block"
                >
                  <div
                    className="relative mb-4 w-full overflow-hidden rounded-sm bg-muted/30"
                    style={{ aspectRatio: '4 / 5' }}
                  >
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
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight transition-all group-hover:italic">
                      {locale === 'vi' ? product.nameVi : product.nameEn}
                    </h3>
                    <p className="text-sm font-light text-muted-foreground">
                      {product.priceVND.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-custom">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-8 uppercase tracking-wider">{t('philosophy')}</h2>
            <p className="leading-relaxed text-muted-foreground">{t('philosophyText')}</p>
            <Link
              href={`/${locale}/about`}
              className="btn-ghost mt-8 inline-flex items-center gap-2"
            >
              {t('learnMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
