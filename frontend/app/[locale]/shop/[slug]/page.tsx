'use client'

import { notFound } from 'next/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useProduct } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { Instagram, Facebook, Loader2, ArrowLeft } from 'lucide-react'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const locale = useLocale() as 'vi' | 'en'
  const { data: product, isLoading, error } = useProduct(params.slug)
  const { data: socialLinks } = useSocialLinks()

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
    <div className="container-custom spacing-lg">
      {/* Back Button */}
      <Link
        href={`/${locale}/shop`}
        className="inline-flex items-center gap-2 mb-12 hover:italic transition-all animate-fade-in"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="uppercase tracking-wider">Quay lại</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-12 md:gap-16">
        {/* Images */}
        <div className="space-y-4 stagger-children">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="aspect-product bg-muted/20 overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={name}
                  width={600}
                  height={800}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                  {product.images.slice(1, 4).map((image, index) => (
                    <div key={index} className="aspect-square bg-muted/20 overflow-hidden">
                      <Image
                        src={image}
                        alt={`${name} ${index + 2}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
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
            <h1 className="text-2xl md:text-3xl uppercase tracking-wider mb-4">
              {name}
            </h1>
            <p className="text-xl text-muted-foreground">
              {product.priceVND.toLocaleString('vi-VN')} VND
            </p>
          </div>

          {description && (
            <div className="space-y-4">
              <h2 className="uppercase tracking-wider">Chi tiết sản phẩm</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Inquiry Section */}
          <div className="space-y-4 pt-6 border-t border-primary/10">
            <h3 className="uppercase tracking-wider">Liên hệ đặt hàng</h3>
            <p className="text-muted-foreground leading-relaxed">
              Để đặt hàng hoặc tìm hiểu thêm về sản phẩm này, vui lòng liên hệ với chúng tôi qua:
            </p>
            <div className="flex gap-4">
              {socialLinks?.instagram && (
                <a
                  href={`${socialLinks.instagram}?text=Xin chào, tôi quan tâm đến sản phẩm: ${name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Instagram</span>
                </a>
              )}
              {socialLinks?.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Facebook</span>
                </a>
              )}
            </div>
          </div>

          {/* Product Meta */}
          <div className="space-y-2 pt-6 border-t border-primary/10 text-sm text-muted-foreground">
            <p>Mã sản phẩm: {product.slug.toUpperCase()}</p>
            {product.isActive ? (
              <p className="text-primary">Còn hàng</p>
            ) : (
              <p>Tạm hết hàng</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
}
