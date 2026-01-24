'use client'

import { Instagram, Facebook, Loader2, ArrowLeft, Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useBanners } from '@/hooks/use-banners'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
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

  // Get product name for document title (handle loading state)
  const name = product ? (locale === 'vi' ? product.nameVi : product.nameEn) : t('loading')

  // Update document title with product name - must be called before conditional returns
  useDocumentTitle(name)

  if (isLoading) {
    return (
      <div className="container-custom spacing-lg flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          className="animate-fade-in mb-8 inline-flex items-center gap-2 transition-all hover:italic md:mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider md:text-sm">{tCommon('back')}</span>
        </Link>

        <div className="mb-16 grid gap-8 md:mb-24 md:grid-cols-[1.2fr_0.8fr] md:gap-12 lg:gap-24">
          {/* Images */}
          <div className="stagger-children space-y-4">
            {product.images && product.images.length > 0 ? (
              <>
                <div
                  className="group relative w-full overflow-hidden rounded-sm bg-muted/20"
                  style={{ aspectRatio: '4 / 5' }}
                >
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
                      <div
                        key={index}
                        className="group relative w-full overflow-hidden rounded-sm bg-muted/20"
                        style={{ aspectRatio: '4 / 5' }}
                      >
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
              <div className="aspect-product flex items-center justify-center bg-muted/20 text-muted-foreground">
                {t('noImages')}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="relative">
            <div className="animate-fade-in-up space-y-8 md:sticky md:top-32 md:space-y-10">
              {/* Header */}
              <div className="space-y-3 md:space-y-4">
                <h1 className="font-serif text-2xl font-normal uppercase leading-snug tracking-widest text-foreground md:text-3xl">
                  {name}
                </h1>
                <div className="flex items-center gap-3">
                  <p className="font-serif text-xl font-light text-foreground/80 md:text-2xl">
                    {priceDisplay.currentPrice}
                  </p>
                  {priceDisplay.hasDiscount && priceDisplay.originalPrice && (
                    <>
                      <p className="text-lg font-light text-muted-foreground/40 line-through">
                        {priceDisplay.originalPrice}
                      </p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs uppercase tracking-wider text-primary">
                        -{priceDisplay.discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {(locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn) && (
                <div className="text-sm font-light leading-relaxed text-muted-foreground md:text-lg">
                  {locale === 'vi' ? product.shortDescriptionVi : product.shortDescriptionEn}
                </div>
              )}

              <div className="h-px w-full bg-border/40" />

              {/* View Details */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/80 transition-colors group-hover:text-foreground md:text-sm">
                        {t('viewDetails')}
                      </span>
                      <Info className="h-5 w-5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-none bg-background/95 shadow-2xl backdrop-blur-sm">
                  <DialogHeader className="mb-6 md:mb-8">
                    <DialogTitle className="mb-2 font-serif text-xl uppercase tracking-wider md:text-2xl">
                      {name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-8 md:space-y-10">
                    {/* Description */}
                    {description && (
                      <div className="space-y-4">
                        <div
                          className="prose prose-sm md:prose-base prose-neutral dark:prose-invert prose-p:font-light prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-normal prose-img:rounded-md prose-img:w-full prose-a:text-primary max-w-none text-muted-foreground [&_.prose]:text-justify"
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      </div>
                    )}

                    <div className="h-px w-full bg-border/40" />

                    {/* Material & Dimensions */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12">
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('material')}
                        </h3>
                        <p className="font-serif text-lg md:text-xl">{product.material}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('dimensions')}
                        </h3>
                        <p className="font-serif text-lg md:text-xl">{product.dimensions}</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="h-px w-full bg-border/40" />

              {/* Inquiry Section */}
              <div className="space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t('contactOrder')}
                </h3>
                <p className="max-w-sm text-sm font-light leading-relaxed text-muted-foreground/80">
                  {t('contactNote')}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                  {socialLinks?.instagramUsername && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-center gap-3 border border-foreground/10 bg-background px-6 py-3 transition-all duration-300 hover:border-foreground md:py-4"
                    >
                      <Instagram className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {t('instagram')}
                      </span>
                    </a>
                  )}
                  {socialLinks?.facebookPageUrl && (
                    <a
                      href={socialLinks.facebookPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-center gap-3 border border-foreground/10 bg-background px-6 py-3 transition-all duration-300 hover:border-foreground md:py-4"
                    >
                      <Facebook className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {t('facebook')}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Promise / Mini Footer */}
        <div className="mb-16 grid gap-8 bg-muted/10 p-8 text-center md:mb-24 md:grid-cols-3 md:p-12">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('handcrafted')}</h3>
            <p className="text-sm text-muted-foreground">{t('handcraftedDesc')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('safeShipping')}</h3>
            <p className="text-sm text-muted-foreground">{t('safeShippingDesc')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t('support')}</h3>
            <p className="text-sm text-muted-foreground">{t('supportDesc')}</p>
          </div>
        </div>

        {/* Related Products */}
        <section className="space-y-8 border-t border-border/10 pb-12 pt-16 md:space-y-12 md:pb-24 md:pt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl uppercase tracking-wider">{t('relatedProducts')}</h2>
            <Link href={`/${locale}/shop`} className="nav-link text-sm">
              {tHome('viewAll')}
            </Link>
          </div>

          <div className="grid-products stagger-children">
            {relatedProducts?.data
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((item) => (
                <ProductCard key={item.id} product={item} locale={locale} />
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}
