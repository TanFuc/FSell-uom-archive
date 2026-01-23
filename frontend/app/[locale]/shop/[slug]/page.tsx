'use client'

import { notFound } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { useBanners } from '@/hooks/use-banners'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Instagram, Facebook, Loader2, ArrowLeft, Info } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { BannerCarousel } from '@/components/BannerCarousel'
import { optimizeProductImage } from '@/lib/utils'
import { getDisplayPrice } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

  // Get product name for document title (handle loading state)
  const name = product 
    ? (locale === 'vi' ? product.nameVi : product.nameEn)
    : t('loading')
  
  // Update document title with product name - must be called before conditional returns
  useDocumentTitle(name)

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

  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn
  const priceDisplay = getDisplayPrice(product, locale)

  return (
    <div>
      {/* Hero Banner Carousel - Full Width */}
      {banners && banners.length > 0 && (
        <div>
          <BannerCarousel banners={banners} locale={locale} />
        </div>
      )}

      <div className="container-custom pt-12 md:pt-24">
      {/* Back Button */}
      <Link
        href={`/${locale}/shop`}
        className="inline-flex items-center gap-2 mb-8 md:mb-12 hover:italic transition-all animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="uppercase tracking-wider text-xs md:text-sm">{tCommon('back')}</span>
      </Link>

      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-12 lg:gap-24 mb-16 md:mb-24">
        {/* Images */}
        <div className="space-y-4 stagger-children">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="relative w-full bg-muted/20 overflow-hidden group rounded-sm" style={{ aspectRatio: '4 / 5' }}>
                <Image
                  src={optimizeProductImage(product.images[0])}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="transition-transform duration-700 group-hover:scale-105"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  {product.images.slice(1).map((image, index) => (
                    <div key={index} className="relative w-full bg-muted/20 overflow-hidden group rounded-sm" style={{ aspectRatio: '4 / 5' }}>
                      <Image
                        src={optimizeProductImage(image, { width: 600, height: 750 })}
                        alt={`${name} ${index + 2}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 30vw"
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
        <div className="relative">
          <div className="md:sticky md:top-32 space-y-8 md:space-y-10 animate-fade-in-up">
            {/* Header */}
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-2xl md:text-3xl uppercase tracking-widest font-serif font-normal text-foreground leading-snug">
                {name}
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-xl md:text-2xl font-serif text-foreground/80 font-light">
                  {priceDisplay.currentPrice}
                </p>
                {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                  <>
                    <p className="text-lg text-muted-foreground/40 line-through font-light">
                      {priceDisplay.originalPrice}
                    </p>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
                      -{priceDisplay.discountPercentage}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Short Description */}
            {(locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn) && (
              <div className="text-sm md:text-lg text-muted-foreground font-light leading-relaxed">
                {locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn}
              </div>
            )}

            <div className="w-full h-px bg-border/40" />

            {/* View Details */}
             <Dialog>
              <DialogTrigger asChild>
                <div className="group cursor-pointer py-2">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest text-xs md:text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                      {t('viewDetails')}
                    </span>
                    <Info className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-none shadow-2xl">
                <DialogHeader className="mb-6 md:mb-8">
                  <DialogTitle className="uppercase tracking-wider text-xl md:text-2xl font-serif mb-2">{name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-8 md:space-y-10">
                   {/* Description */}
                   {description && (
                    <div className="space-y-4">
                      <div 
                        className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none text-muted-foreground prose-p:font-light prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-normal prose-img:rounded-md prose-img:w-full prose-a:text-primary [&_.prose]:text-justify"
                        dangerouslySetInnerHTML={{ __html: description }} 
                      />
                    </div>
                  )}

                  <div className="w-full h-px bg-border/40" />

                  {/* Material & Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                    <div className="space-y-2">
                      <h3 className="uppercase tracking-wider text-xs font-semibold text-muted-foreground">{t('material')}</h3>
                      <p className="font-serif text-lg md:text-xl">{product.material}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="uppercase tracking-wider text-xs font-semibold text-muted-foreground">{t('dimensions')}</h3>
                      <p className="font-serif text-lg md:text-xl">{product.dimensions}</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="w-full h-px bg-border/40" />

            {/* Inquiry Section */}
            <div className="space-y-6">
              <h3 className="uppercase tracking-widest text-xs font-semibold text-muted-foreground">
                {t('contactOrder')}
              </h3>
              <p className="text-sm text-muted-foreground/80 font-light leading-relaxed max-w-sm">
                {t('contactNote')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {socialLinks?.instagramUsername && (
                  <a
                    href={`https://instagram.com/${socialLinks.instagramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-6 py-3 md:py-4 border border-foreground/10 hover:border-foreground transition-all duration-300 group bg-background"
                  >
                    <Instagram className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="uppercase tracking-wider text-xs font-bold">{t('instagram')}</span>
                  </a>
                )}
                {socialLinks?.facebookPageUrl && (
                  <a
                    href={socialLinks.facebookPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-6 py-3 md:py-4 border border-foreground/10 hover:border-foreground transition-all duration-300 group bg-background"
                  >
                    <Facebook className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="uppercase tracking-wider text-xs font-bold">{t('facebook')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Promise / Mini Footer */}
      <div className="grid md:grid-cols-3 gap-8 p-8 md:p-12 bg-muted/10 mb-16 md:mb-24 text-center">
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
      <section className="space-y-8 md:space-y-12 border-t border-border/10 pt-16 md:pt-24 pb-12 md:pb-24">
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
