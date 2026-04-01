import { type Metadata } from 'next'
import Script from 'next/script'
import { getLocale } from 'next-intl/server'
import ProductClient from './product-client'
import { fetchBranding } from '@/lib/server-utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface Props {
  params: { slug: string }
}

function getBrandName(
  locale: string,
  branding: { brandNameVi?: string | null; brandNameEn?: string | null } | null,
) {
  return locale === 'vi'
    ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
    : (branding?.brandNameEn ?? 'ƯƠM. Archive')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale()
  const [product, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])

  if (!product) return { title: 'Product Not Found' }

  const isVi = locale === 'vi'
  const brandName = getBrandName(locale, branding)
  const name = isVi ? product.nameVi : product.nameEn
  const rawDescription = isVi
    ? product.shortDescriptionVi || product.descriptionVi || ''
    : product.shortDescriptionEn || product.descriptionEn || ''
  const description = rawDescription.replace(/<[^>]*>/g, '').slice(0, 160) || undefined
  const firstImage = product.images?.[0]

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | ${brandName}`,
      description,
      type: 'website',
      images: firstImage ? [{ url: firstImage, width: 1200, height: 1600, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${brandName}`,
      description,
      images: firstImage ? [firstImage] : undefined,
    },
    alternates: {
      canonical: `/${locale}/shop/${params.slug}`,
      languages: {
        vi: `/vi/shop/${params.slug}`,
        en: `/en/shop/${params.slug}`,
      },
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale()
  const [product, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])
  const brandName = getBrandName(locale, branding)

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: locale === 'vi' ? product.nameVi : product.nameEn,
        description:
          locale === 'vi'
            ? (product.shortDescriptionVi || product.descriptionVi || '')
                .replace(/<[^>]*>/g, '')
                .slice(0, 300)
            : (product.shortDescriptionEn || product.descriptionEn || '')
                .replace(/<[^>]*>/g, '')
                .slice(0, 300),
        image: product.images ?? [],
        sku: product.slug,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'VND',
          price: product.salePriceVND ?? product.priceVND,
          availability:
            product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `https://uomarchive.com/${locale}/shop/${params.slug}`,
        },
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <Script
          id="product-jsonld"
          strategy="beforeInteractive"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {product && (
        <Script
          id="product-breadcrumb-jsonld"
          strategy="beforeInteractive"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: `https://uomarchive.com/${locale}`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: `https://uomarchive.com/${locale}/shop`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: locale === 'vi' ? product.nameVi : product.nameEn,
                  item: `https://uomarchive.com/${locale}/shop/${params.slug}`,
                },
              ],
            }),
          }}
        />
      )}
      <ProductClient params={params} />
    </>
  )
}
