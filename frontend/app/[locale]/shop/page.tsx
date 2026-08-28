import { type Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import { buildPageMetadata, getCanonicalBaseUrl, getSeoBrandName } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import { type Category, type PaginatedResponse, type Product } from '@/lib/types'
import { DATA_REVALIDATE_SECONDS, PAGE_REVALIDATE_SECONDS } from '@/lib/cache-config'
import ShopClient from './shop-client'

const BASE_URL = getCanonicalBaseUrl()
const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8888'
export const revalidate = PAGE_REVALIDATE_SECONDS
const SHOP_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.SHOP_FETCH_TIMEOUT_MS || process.env.SERVER_FETCH_TIMEOUT_MS || '1800',
  10,
)

type ShopSsrData = {
  products?: PaginatedResponse<Product>
  categories?: Category[]
}

function getShopSeo(locale: string) {
  return locale === 'vi'
    ? {
        title: 'Tất cả sản phẩm',
        description:
          'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.',
      }
    : {
        title: 'Shop',
        description:
          'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.',
      }
}

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null
  }

  const root = payload as { data?: unknown }
  const value = root.data ?? payload

  if (value && typeof value === 'object') {
    return value as T
  }

  return null
}

async function fetchJson(url: string): Promise<unknown> {
  const timeout =
    Number.isFinite(SHOP_FETCH_TIMEOUT_MS) && SHOP_FETCH_TIMEOUT_MS > 0
      ? SHOP_FETCH_TIMEOUT_MS
      : 1800
  const res = await fetch(url, {
    next: { revalidate: DATA_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(timeout),
  })

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`)
  }

  return res.json()
}

async function fetchShopSsrData(): Promise<ShopSsrData> {
  const [productsResult, categoriesResult] = await Promise.allSettled([
    fetchJson(`${API_URL}/products?page=1&limit=12&isActive=true`),
    fetchJson(`${API_URL}/categories?includeInactive=false`),
  ])

  return {
    products:
      productsResult.status === 'fulfilled'
        ? unwrapData<PaginatedResponse<Product>>(productsResult.value) ?? undefined
        : undefined,
    categories:
      categoriesResult.status === 'fulfilled'
        ? unwrapData<Category[]>(categoriesResult.value) ?? undefined
        : undefined,
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const seo = getShopSeo(locale)

  return buildPageMetadata({
    locale,
    path: `/${locale}/shop`,
    title: seo.title,
    description: seo.description,
    branding,
    alternates: { vi: '/vi/shop', en: '/en/shop', 'x-default': '/vi/shop' },
  })
}

export default async function ShopPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const brandName = getSeoBrandName(locale, branding)
  const seo = getShopSeo(locale)
  const ssrData = await fetchShopSsrData()

  return (
    <>
      <Script
        id="shop-collection-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${brandName} Shop`,
            url: `${BASE_URL}/${locale}/shop`,
            description: seo.description,
          }),
        }}
      />
      <Script
        id="shop-breadcrumb-jsonld"
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
                name: locale === 'vi' ? 'Cửa hàng' : 'Shop',
                item: `${BASE_URL}/${locale}/shop`,
              },
            ],
          }),
        }}
      />
      <Suspense fallback={null}>
        <ShopClient initialProducts={ssrData.products} initialCategories={ssrData.categories} />
      </Suspense>
    </>
  )
}
