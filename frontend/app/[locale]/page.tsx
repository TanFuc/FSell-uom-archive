import { type Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import {
  buildPageMetadata,
  getCanonicalBaseUrl,
  getSeoBrandName,
  getSeoImageUrl,
  getSeoSiteDescription,
  getSeoSiteTitle,
} from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import { type Product } from '@/lib/sitemap-data'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY, type StoryItem } from '@/lib/stories'
import { type Banner } from '@/lib/types'
import HomeClient from './home-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8888/api'
export const revalidate = 0

type SiteContentResponse = Record<string, unknown>
type HomeSsrData = {
  products: { data: Product[]; meta: { totalItems: number } }
  siteContent: SiteContentResponse
  banners: Banner[]
  stories: StoryItem[]
}

function getRecordData(payload: unknown): SiteContentResponse {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}
  const root = payload as { data?: unknown }
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as SiteContentResponse
  }
  return payload as SiteContentResponse
}

function getProducts(payload: unknown): Product[] {
  const root = getRecordData(payload)
  const nested = getRecordData(root.data)
  const value = Array.isArray(nested.data) ? nested.data : root.data
  return Array.isArray(value) ? (value as Product[]) : []
}

function getBanners(payload: unknown): Banner[] {
  const root = getRecordData(payload)
  return Array.isArray(root.data) ? (root.data as Banner[]) : []
}

async function fetchHomeSsrData(): Promise<HomeSsrData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const fetchOptions = {
      next: { revalidate: 0 },
      signal: controller.signal,
    }

    const [productsRes, contentRes, bannersRes] = await Promise.allSettled([
      fetch(`${API_URL}/products?page=1&limit=8&isActive=true`, fetchOptions),
      fetch(`${API_URL}/settings/site-content`, fetchOptions),
      fetch(`${API_URL}/banners?activeOnly=true`, fetchOptions),
    ])

    const productsData: unknown =
      productsRes.status === 'fulfilled' && productsRes.value.ok
        ? await productsRes.value.json()
        : null
    const contentData: unknown =
      contentRes.status === 'fulfilled' && contentRes.value.ok
        ? await contentRes.value.json()
        : null
    const bannersData: unknown =
      bannersRes.status === 'fulfilled' && bannersRes.value.ok
        ? await bannersRes.value.json()
        : null

    const siteContent = getRecordData(contentData)
    const products = getProducts(productsData)
    const banners = getBanners(bannersData)
    const stories = parseStories(siteContent[STORIES_CONTENT_KEY]).filter(
      (story) => story.isVisible !== false,
    )

    return {
      products: { data: products.slice(0, 8), meta: { totalItems: products.length } },
      siteContent,
      banners: banners.slice(0, 10),
      stories: stories.slice(0, 4),
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[SEO] SSR fetch failed or timed out:', error)
    }
    return {
      products: { data: [], meta: { totalItems: 0 } },
      siteContent: {},
      banners: [],
      stories: [],
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const siteTitle = getSeoSiteTitle(locale, branding)

  return {
    ...buildPageMetadata({
      locale,
      path: `/${locale}`,
      title: siteTitle,
      description: getSeoSiteDescription(locale, branding),
      branding,
      image: getSeoImageUrl(branding),
      alternates: { vi: '/vi', en: '/en', 'x-default': '/vi' },
    }),
    title: { absolute: siteTitle },
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const baseUrl = getCanonicalBaseUrl()
  const [branding, ssrData] = await Promise.all([fetchBranding(), fetchHomeSsrData()])

  const isVi = locale === 'vi'
  const brandName = getSeoBrandName(locale, branding)
  const alternateBrandName = getSeoBrandName(isVi ? 'en' : 'vi', branding)
  const siteTitle = getSeoSiteTitle(locale, branding)
  const description = getSeoSiteDescription(locale, branding)
  const logo = getSeoImageUrl(branding)
  const socialProfiles = ['https://instagram.com/uomarchive', 'https://facebook.com/uomarchive']

  return (
    <>
      <Script
        id="home-org-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: brandName,
            alternateName: alternateBrandName,
            url: baseUrl,
            logo,
            sameAs: socialProfiles,
            description,
          }),
        }}
      />
      <Script
        id="home-website-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: brandName,
            alternateName: [alternateBrandName, siteTitle],
            url: `${baseUrl}/${locale}`,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${baseUrl}/${locale}/shop?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <section className="sr-only" suppressHydrationWarning>
        <h1 suppressHydrationWarning>{siteTitle}</h1>
        <p suppressHydrationWarning>{description}</p>

        {ssrData.products.data.length > 0 && (
          <div suppressHydrationWarning>
            <h2 suppressHydrationWarning>{isVi ? 'Sản phẩm mới' : 'New Arrivals'}</h2>
            <ul suppressHydrationWarning>
              {ssrData.products.data.map((product) => (
                <li key={product.id} suppressHydrationWarning>
                  <Link href={`/${locale}/shop/${product.slug}`} suppressHydrationWarning>
                    {isVi ? product.nameVi : product.nameEn} -{' '}
                    {product.priceVND.toLocaleString('vi-VN')} VND
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ssrData.stories.length > 0 && (
          <div suppressHydrationWarning>
            <h2 suppressHydrationWarning>Journal</h2>
            <ul suppressHydrationWarning>
              {ssrData.stories.map((story) => (
                <li key={story.id} suppressHydrationWarning>
                  <a
                    href={`/${locale}/journal/${getStorySlug(story, locale)}`}
                    suppressHydrationWarning
                  >
                    {isVi ? story.titleVi : story.titleEn}
                  </a>
                  <p suppressHydrationWarning>{isVi ? story.summaryVi : story.summaryEn}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <HomeClient
        initialProducts={ssrData.products}
        initialSiteContent={ssrData.siteContent}
        initialBanners={ssrData.banners}
      />
    </>
  )
}
