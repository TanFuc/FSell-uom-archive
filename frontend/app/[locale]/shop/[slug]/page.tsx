'use client'

import { notFound } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { useBanners } from '@/hooks/use-banners'
import { Instagram, Facebook, Loader2, ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { BannerCarousel } from '@/components/BannerCarousel'
import { optimizeProductImage } from '@/lib/utils'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const tHome = useTranslations('Home')
  const { data: product, isLoading, error } = useProduct(params.slug)
  const { data: socialLinks } = useSocialLinks()
  const { data: banners } = useBanners(true)

  // Fetch related products (latest for now) - must be called before any conditional returns
  const { data: relatedProducts } = useProducts({
    page: 1,
    limit: 4,
    isActive: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  if (isLoading) {
    return (
      <div className="container-custom spacing-lg flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

  const name = locale === 'vi' ? product.nameVi : product.nameEn
  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn

  return (
    <div>
      {/* Hero Banner Carousel - Full Width */}
      {banners && banners.length > 0 && (
        <div>
          <BannerCarousel banners={banners} locale={locale} />
        </div>
      )}

      <div className="container-custom pt-16 md:pt-24">
      {/* Back Button */}
      <Link
        href={`/${locale}/shop`}
        className="inline-flex items-center gap-2 mb-12 hover:italic transition-all animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="uppercase tracking-wider">{tCommon('back')}</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-24">
        {/* Images */}
        <div className="space-y-4 stagger-children">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="relative w-full bg-muted/20 overflow-hidden group rounded-sm" style={{ aspectRatio: '4 / 5' }}>
                <Image
                  src={optimizeProductImage(product.images[0])}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="transition-transform duration-700 group-hover:scale-105"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {product.images.slice(1, 4).map((image, index) => (
                    <div key={index} className="relative w-full bg-muted/20 overflow-hidden group rounded-sm" style={{ aspectRatio: '4 / 5' }}>
                      <Image
                        src={optimizeProductImage(image, { width: 400, height: 500 })}
                        alt={`${name} ${index + 2}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 17vw"
                        className="transition-transform duration-500 group-hover:scale-110"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-product bg-muted/20 flex items-center justify-center text-muted-foreground">
              {t('noImages')}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8 stagger-children">
          <div>
            <h1 className="text-3xl md:text-4xl uppercase tracking-wider mb-4 font-light">
              {name}
            </h1>
            <p className="text-2xl text-muted-foreground font-light">
              {product.priceVND.toLocaleString('vi-VN')}₫
            </p>
          </div>

          <div className="border-t border-border/50 pt-8 space-y-6">
             {/* Description */}
             {description && (
              <div className="space-y-4">
                <h2 className="uppercase tracking-wider text-sm font-semibold">{t('details')}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-justify">
                  {description}
                </p>
              </div>
            )}

            {/* Material & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="uppercase tracking-wider text-xs text-muted-foreground mb-1">{t('material')}</h3>
                <p>{product.material}</p>
              </div>
              <div>
                <h3 className="uppercase tracking-wider text-xs text-muted-foreground mb-1">{t('dimensions')}</h3>
                <p>{product.dimensions}</p>
              </div>
            </div>
          </div>

          {/* Inquiry Section */}
          <div className="space-y-4 pt-8 border-t border-border/50">
            <h3 className="uppercase tracking-wider text-sm font-semibold">{t('contactOrder')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {t('contactNote')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="uppercase tracking-wider">{t('instagram')}</span>
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn flex items-center justify-center gap-2 flex-1 bg-transparent hover:bg-foreground hover:text-background"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="uppercase tracking-wider">{t('facebook')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brand Promise / Mini Footer */}
      <div className="grid md:grid-cols-3 gap-8 p-12 bg-muted/10 mb-24 text-center">
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">{t('handcrafted')}</h3>
          <p className="text-sm text-muted-foreground">{t('handcraftedDesc')}</p>
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">{t('safeShipping')}</h3>
          <p className="text-sm text-muted-foreground">{t('safeShippingDesc')}</p>
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">{t('support')}</h3>
          <p className="text-sm text-muted-foreground">{t('supportDesc')}</p>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-12 border-t border-border/10 pt-24 pb-16 md:pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl uppercase tracking-wider">{t('relatedProducts')}</h2>
          <Link href={`/${locale}/shop`} className="nav-link text-sm">
            {tHome('viewAll')}
          </Link>
        </div>

        <div className="grid-products stagger-children">
            {relatedProducts?.data.filter(p => p.id !== product.id).slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
        </div>
      </section>
      </div>
    </div>
  )
}
