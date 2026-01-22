'use client'

import { notFound } from 'next/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { useBanners } from '@/hooks/use-banners'
import { Instagram, Facebook, Loader2, ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { BannerCarousel } from '@/components/BannerCarousel'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const locale = useLocale() as 'vi' | 'en'
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
        <span className="uppercase tracking-wider">Quay lại</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-24">
        {/* Images */}
        <div className="space-y-4 stagger-children">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="relative aspect-product bg-muted/20 overflow-hidden group">
                <Image
                  src={product.images[0]}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {product.images.slice(1, 4).map((image, index) => (
                    <div key={index} className="relative aspect-product bg-muted/20 overflow-hidden group">
                      <Image
                        src={image}
                        alt={`${name} ${index + 2}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 17vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-product bg-muted/20 flex items-center justify-center text-muted-foreground">
              No Images
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
              {product.priceVND.toLocaleString('vi-VN')} VND
            </p>
          </div>

          <div className="border-t border-border/50 pt-8 space-y-6">
             {/* Description */}
             {description && (
              <div className="space-y-4">
                <h2 className="uppercase tracking-wider text-sm font-semibold">Chi tiết sản phẩm</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-justify">
                  {description}
                </p>
              </div>
            )}
            
            {/* Material & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="uppercase tracking-wider text-xs text-muted-foreground mb-1">Chất liệu</h3>
                <p>{product.material}</p>
              </div>
              <div>
                <h3 className="uppercase tracking-wider text-xs text-muted-foreground mb-1">Kích thước</h3>
                <p>{product.dimensions}</p>
              </div>
            </div>
          </div>

          {/* Inquiry Section */}
          <div className="space-y-4 pt-8 border-t border-border/50">
            <h3 className="uppercase tracking-wider text-sm font-semibold">Liên hệ đặt hàng</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Sản phẩm tại Ươm là độc bản hoặc số lượng giới hạn. Vui lòng liên hệ để kiểm tra tình trạng hàng.
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
                  <span className="uppercase tracking-wider">Instagram</span>
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
                  <span className="uppercase tracking-wider">Facebook</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brand Promise / Mini Footer */}
      <div className="grid md:grid-cols-3 gap-8 p-12 bg-muted/10 mb-24 text-center">
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">Thủ công tinh xảo</h3>
          <p className="text-sm text-muted-foreground">Mỗi sản phẩm là một câu chuyện độc đáo từ bàn tay nghệ nhân.</p>
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">Vận chuyển an toàn</h3>
          <p className="text-sm text-muted-foreground">Đóng gói cẩn thận, đảm bảo sản phẩm đến tay bạn nguyên vẹn.</p>
        </div>
        <div className="space-y-2">
          <h3 className="uppercase tracking-wider text-sm font-semibold">Hỗ trợ tận tâm</h3>
          <p className="text-sm text-muted-foreground">Đội ngũ Ươm luôn sẵn sàng tư vấn và hỗ trợ bạn.</p>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-12 border-t border-border/10 pt-24 pb-16 md:pb-24">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl uppercase tracking-wider">Có thể bạn sẽ thích</h2>
          <Link href={`/${locale}/shop`} className="nav-link text-sm">
            Xem tất cả
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
