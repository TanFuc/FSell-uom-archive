import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { getLocale } from 'next-intl/server'
import { fetchBranding } from '@/lib/server-utils'
import ProductClient from './product-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(
  /\/$/,
  '',
)

type ProductDetail = {
  slug: string
  nameVi?: string
  nameEn?: string
  shortDescriptionVi?: string
  shortDescriptionEn?: string
  descriptionVi?: string
  descriptionEn?: string
  images?: string[]
  priceVND?: number
  salePriceVND?: number | null
  stock?: number
  material?: string
  dimensions?: string
  updatedAt?: string
  category?: {
    nameVi?: string
    nameEn?: string
  } | null
}

type ProductResponse = {
  data?: ProductDetail
}

type FetchProductResult =
  | { status: 'ok'; product: ProductDetail }
  | { status: 'not-found' }
  | { status: 'error' }

function stripHtml(value: string | undefined): string {
  return (value ?? '').replace(/<[^>]*>/g, '').trim()
}

function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `${BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function unwrapProductResponse(payload: unknown): ProductDetail | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const root = payload as { data?: unknown }

  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    const nested = root.data as ProductResponse

    if (nested.data && typeof nested.data === 'object') {
      return nested.data
    }

    return root.data as ProductDetail
  }

  return null
}

async function fetchProduct(slug: string): Promise<FetchProductResult> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 300 } })
    if (res.status === 404) {
      return { status: 'not-found' }
    }

    if (!res.ok) {
      return { status: 'error' }
    }

    const payload = (await res.json()) as unknown
    const product = unwrapProductResponse(payload)

    if (!product) {
      return { status: 'error' }
    }

    return { status: 'ok', product }
  } catch {
    return { status: 'error' }
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
  const [result, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])

  if (result.status === 'not-found') {
    return {
      title: 'Product Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  if (result.status === 'error') {
    return {
      title: locale === 'vi' ? 'Sản phẩm' : 'Product',
      description:
        locale === 'vi'
          ? 'Khám phá sản phẩm thủ công từ ƯƠM. Archive.'
          : 'Discover handcrafted products from UOM. Archive.',
      alternates: {
        canonical: `/${locale}/shop/${params.slug}`,
        languages: {
          vi: `/vi/shop/${params.slug}`,
          en: `/en/shop/${params.slug}`,
          'x-default': `/vi/shop/${params.slug}`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }

  const isVi = locale === 'vi'
  const brandName = getBrandName(locale, branding)
  const product = result.product
  const name = isVi ? product.nameVi : product.nameEn
  const rawDescription =
    (isVi
      ? product.shortDescriptionVi || product.descriptionVi
      : product.shortDescriptionEn || product.descriptionEn) ?? ''
  const description = stripHtml(rawDescription).slice(0, 160) || undefined
  const firstImage = product.images?.[0] ? toAbsoluteUrl(product.images[0]) : undefined
  const canonicalPath = `/${locale}/shop/${params.slug}`

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | ${brandName}`,
      description,
      url: `${BASE_URL}${canonicalPath}`,
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
      canonical: canonicalPath,
      languages: {
        vi: `/vi/shop/${params.slug}`,
        en: `/en/shop/${params.slug}`,
        'x-default': `/vi/shop/${params.slug}`,
      },
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale()
  const [result, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])

  if (result.status === 'not-found') {
    notFound()
  }

  const product = result.status === 'ok' ? result.product : null
  const brandName = getBrandName(locale, branding)
  const isVi = locale === 'vi'
  const name = product ? (isVi ? product.nameVi : product.nameEn) : ''
  const description = product
    ? stripHtml(
        isVi
          ? product.shortDescriptionVi || product.descriptionVi || ''
          : product.shortDescriptionEn || product.descriptionEn || '',
      ).slice(0, 300)
    : ''
  const productUrl = `${BASE_URL}/${locale}/shop/${params.slug}`
  const images = (product?.images ?? []).map((value) => toAbsoluteUrl(value))
  const categoryName = isVi ? product?.category?.nameVi : product?.category?.nameEn

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': productUrl,
        url: productUrl,
        name,
        description,
        image: images,
        sku: product.slug,
        category: categoryName || undefined,
        inLanguage: isVi ? 'vi-VN' : 'en-US',
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'VND',
          price: String(product.salePriceVND ?? product.priceVND ?? 0),
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            (product.stock ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
        additionalProperty: [
          product.material
            ? {
                '@type': 'PropertyValue',
                name: isVi ? 'Chất liệu' : 'Material',
                value: product.material,
              }
            : null,
          product.dimensions
            ? {
                '@type': 'PropertyValue',
                name: isVi ? 'Kích thước' : 'Dimensions',
                value: product.dimensions,
              }
            : null,
        ].filter(Boolean),
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
                  item: `https://www.uomarchive.com/${locale}`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: `https://www.uomarchive.com/${locale}/shop`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name,
                  item: productUrl,
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
