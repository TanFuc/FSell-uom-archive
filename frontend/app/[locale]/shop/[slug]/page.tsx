import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { getLocale } from 'next-intl/server'
import { cache } from 'react'
import { DATA_REVALIDATE_SECONDS, PAGE_REVALIDATE_SECONDS } from '@/lib/cache-config'
import {
  buildPageMetadata,
  getCanonicalBaseUrl,
  getSeoBrandName,
  normalizeSeoText,
  truncateMetaDescription,
} from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import { type Product } from '@/lib/types'
import ProductClient from './product-client'

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8888'
const BASE_URL = getCanonicalBaseUrl()
const PRODUCT_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.PRODUCT_FETCH_TIMEOUT_MS || process.env.SERVER_FETCH_TIMEOUT_MS || '1800',
  10,
)
export const revalidate = PAGE_REVALIDATE_SECONDS

type ProductDetail = Product

type ProductResponse = {
  data?: ProductDetail
}

type FetchProductResult =
  | { status: 'ok'; product: ProductDetail }
  | { status: 'not-found' }
  | { status: 'error' }

type FetchMode = 'revalidate' | 'no-store'

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

async function isVerifiedApiNotFound(res: Response): Promise<boolean> {
  const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    return false
  }

  try {
    const payload = (await res.json()) as unknown
    if (!payload || typeof payload !== 'object') {
      return false
    }

    return (payload as { statusCode?: unknown }).statusCode === 404
  } catch {
    return false
  }
}

async function fetchProductAttempt(slug: string, mode: FetchMode): Promise<FetchProductResult> {
  try {
    const configuredTimeout =
      Number.isFinite(PRODUCT_FETCH_TIMEOUT_MS) && PRODUCT_FETCH_TIMEOUT_MS > 0
        ? PRODUCT_FETCH_TIMEOUT_MS
        : 1800
    const timeout = mode === 'no-store' ? Math.max(configuredTimeout, 5000) : configuredTimeout
    const productUrl = `${API_URL}/products/${encodeURIComponent(slug)}`
    const res = await fetch(productUrl, {
      ...(mode === 'no-store'
        ? { cache: 'no-store' as const }
        : { next: { revalidate: DATA_REVALIDATE_SECONDS } }),
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeout),
    })

    if (res.status === 404) {
      console.warn(`[product] API returned 404 (${mode}) for ${productUrl}`)
      return (await isVerifiedApiNotFound(res)) ? { status: 'not-found' } : { status: 'error' }
    }

    if (!res.ok) {
      console.error(`[product] API returned ${res.status} (${mode}) for ${productUrl}`)
      return { status: 'error' }
    }

    const payload = (await res.json()) as unknown
    const product = unwrapProductResponse(payload)

    if (!product) {
      return { status: 'error' }
    }

    return { status: 'ok', product }
  } catch (error) {
    console.error(`[product] request failed (${mode}) for slug "${slug}"`, error)
    return { status: 'error' }
  }
}

async function fetchProductWithVerification(slug: string): Promise<FetchProductResult> {
  const firstAttempt = await fetchProductAttempt(slug, 'revalidate')

  if (firstAttempt.status === 'ok') {
    return firstAttempt
  }

  const verificationAttempt = await fetchProductAttempt(slug, 'no-store')

  if (verificationAttempt.status === 'ok') {
    return verificationAttempt
  }

  if (firstAttempt.status === 'not-found' && verificationAttempt.status === 'not-found') {
    return { status: 'not-found' }
  }

  return { status: 'error' }
}

// Metadata and page rendering must agree on one product result per request.
const fetchProduct = cache(fetchProductWithVerification)

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await getLocale()) === 'vi' ? 'vi' : 'en'
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
    return buildPageMetadata({
      locale,
      path: `/${locale}/shop/${params.slug}`,
      title: locale === 'vi' ? 'Sản phẩm' : 'Product',
      description:
        locale === 'vi'
          ? 'Khám phá sản phẩm thủ công từ ƯƠM. Archive.'
          : 'Discover handcrafted products from ƯƠM. Archive.',
      branding,
      alternates: {
        vi: `/vi/shop/${params.slug}`,
        en: `/en/shop/${params.slug}`,
        'x-default': `/vi/shop/${params.slug}`,
      },
    })
  }

  const isVi = locale === 'vi'
  const product = result.product
  const name = normalizeSeoText(isVi ? product.nameVi : product.nameEn) || params.slug
  const rawDescription =
    (isVi
      ? product.shortDescriptionVi || product.descriptionVi
      : product.shortDescriptionEn || product.descriptionEn) ?? ''
  const description =
    truncateMetaDescription(rawDescription) ||
    (isVi
      ? `Khám phá ${name}, sản phẩm gốm sứ thủ công từ ƯƠM. Archive.`
      : `Discover ${name}, a handcrafted ceramic product from ƯƠM. Archive.`)
  const firstImage = product.images?.[0] ? toAbsoluteUrl(product.images[0]) : undefined
  const canonicalPath = `/${locale}/shop/${params.slug}`

  return buildPageMetadata({
    locale,
    path: canonicalPath,
    title: name,
    description,
    branding,
    image: firstImage,
    alternates: {
      vi: `/vi/shop/${params.slug}`,
      en: `/en/shop/${params.slug}`,
      'x-default': `/vi/shop/${params.slug}`,
    },
  })
}

export default async function ProductPage({ params }: Props) {
  const locale = await getLocale()
  const [result, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])

  if (result.status === 'not-found') {
    notFound()
  }

  const product = result.status === 'ok' ? result.product : null
  const brandName = getSeoBrandName(locale, branding)
  const isVi = locale === 'vi'
  const name = product ? (isVi ? product.nameVi : product.nameEn) : ''
  const description = product
    ? normalizeSeoText(
        isVi
          ? product.shortDescriptionVi || product.descriptionVi || ''
          : product.shortDescriptionEn || product.descriptionEn || '',
      ).slice(0, 300)
    : ''
  const productUrl = `${BASE_URL}/${locale}/shop/${params.slug}`
  const images = (product?.images ?? []).map((value) => toAbsoluteUrl(value))
  const categoryName = isVi ? product?.category?.nameVi : product?.category?.nameEn
  const faqItems = product
    ? isVi
      ? [
          {
            question: `${name} phù hợp với không gian nào?`,
            answer:
              'Sản phẩm phù hợp với không gian sống tối giản hoặc góc trưng bày thủ công, tôn bật chất liệu gốm.',
          },
          {
            question: 'Cách bảo quản gốm sứ thủ công?',
            answer:
              'Hạn chế va đập mạnh, vệ sinh nhẹ nhàng bằng khăn mềm và tránh thay đổi nhiệt độ đột ngột.',
          },
          {
            question: 'Làm sao để đặt hàng hoặc tư vấn?',
            answer:
              'Bạn có thể nhắn qua Instagram/Facebook hoặc gửi yêu cầu tư vấn ngay trên trang sản phẩm.',
          },
        ]
      : [
          {
            question: `Where does ${name} fit best?`,
            answer:
              'It complements minimal interiors or curated display corners, highlighting handcrafted ceramic textures.',
          },
          {
            question: 'How should I care for handcrafted ceramics?',
            answer:
              'Avoid heavy impact, clean gently with a soft cloth, and keep away from sudden temperature changes.',
          },
          {
            question: 'How can I inquire or place an order?',
            answer:
              'Message us via Instagram/Facebook or send an inquiry directly on the product page.',
          },
        ]
    : []

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
          seller: {
            '@type': 'Organization',
            name: brandName,
            url: BASE_URL,
          },
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
                  item: `${BASE_URL}/${locale}`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: `${BASE_URL}/${locale}/shop`,
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
      {product && faqItems.length > 0 && (
        <Script
          id="product-faq-jsonld"
          strategy="beforeInteractive"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            }),
          }}
        />
      )}
      <ProductClient params={params} initialProduct={product} />
    </>
  )
}
