import { type Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import {
  buildAbsoluteUrl,
  buildPageMetadata,
  getCanonicalBaseUrl,
  getSeoBrandName,
  getSeoLogoUrl,
  getSeoSiteDescription,
  getSeoSiteTitle,
  getSeoSocialImageUrl,
} from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY, type StoryItem } from '@/lib/stories'
import { type Banner, type Product } from '@/lib/types'
import HomeClient from './home-client'

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8888/api'
export const dynamic = 'force-dynamic'

type SiteContentResponse = Record<string, unknown>
type HomeSiteContent = Record<string, string>
type HomeSsrData = {
  products: {
    data: Product[]
    meta: { total: number; page: number; limit: number; totalPages: number; totalItems: number }
  }
  siteContent: HomeSiteContent
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

function getSiteContent(payload: unknown): HomeSiteContent {
  const root = getRecordData(payload)
  return Object.fromEntries(
    Object.entries(root).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

async function fetchHomeSsrData(): Promise<HomeSsrData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const fetchOptions = {
      cache: 'no-store' as const,
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

    const siteContent = getSiteContent(contentData)
    const products = getProducts(productsData)
    const banners = getBanners(bannersData)
    const stories = parseStories(siteContent[STORIES_CONTENT_KEY]).filter(
      (story) => story.isVisible !== false,
    )

    return {
      products: {
        data: products.slice(0, 8),
        meta: {
          total: products.length,
          page: 1,
          limit: 8,
          totalPages: Math.max(1, Math.ceil(products.length / 8)),
          totalItems: products.length,
        },
      },
      siteContent,
      banners: banners.slice(0, 10),
      stories: stories.slice(0, 4),
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[SEO] SSR fetch failed or timed out:', error)
    }
    return {
      products: {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 8,
          totalPages: 1,
          totalItems: 0,
        },
      },
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
      image: getSeoSocialImageUrl(branding),
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
  const logo = buildAbsoluteUrl(getSeoLogoUrl(branding), baseUrl)
  const socialProfiles = ['https://instagram.com/uomarchive', 'https://facebook.com/uomarchive']
  const navigationItems = [
    { name: isVi ? 'Trang chủ' : 'Home', url: `${baseUrl}/${locale}` },
    { name: isVi ? 'Sản phẩm' : 'Shop', url: `${baseUrl}/${locale}/shop` },
    { name: isVi ? 'Về chúng tôi' : 'About Us', url: `${baseUrl}/${locale}/about` },
    { name: isVi ? 'Tạp chí' : 'Journal', url: `${baseUrl}/${locale}/journal` },
    { name: isVi ? 'Liên hệ' : 'Contact', url: `${baseUrl}/${locale}/about#contact` },
  ]

  return (
    <>
      <Script
        id="home-structured-data-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${baseUrl}/#organization`,
                name: brandName,
                alternateName: alternateBrandName,
                url: baseUrl,
                logo: {
                  '@type': 'ImageObject',
                  url: logo,
                },
                sameAs: socialProfiles,
                description,
              },
              {
                '@type': 'WebSite',
                '@id': `${baseUrl}/#website`,
                name: brandName,
                alternateName: [alternateBrandName, siteTitle],
                url: `${baseUrl}/${locale}`,
                publisher: {
                  '@id': `${baseUrl}/#organization`,
                },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${baseUrl}/${locale}/shop?search={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              },
              ...navigationItems.map((item, index) => ({
                '@type': 'SiteNavigationElement',
                '@id': `${baseUrl}/#site-navigation-${index + 1}`,
                position: index + 1,
                name: item.name,
                url: item.url,
              })),
              {
                '@type': 'ItemList',
                '@id': `${baseUrl}/${locale}#homepage-pages`,
                name: isVi ? 'Cac trang trong website' : 'Pages in this website',
                itemListElement: navigationItems.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: item.name,
                  url: item.url,
                })),
              },
            ],
          }),
        }}
      />

      <section className="sr-only" suppressHydrationWarning>
        <h1 suppressHydrationWarning>{siteTitle}</h1>
        <p suppressHydrationWarning>{description}</p>
        <nav aria-label={isVi ? 'Điều hướng chính' : 'Primary navigation'} suppressHydrationWarning>
          <ul suppressHydrationWarning>
            {navigationItems.map((item) => (
              <li key={item.url} suppressHydrationWarning>
                <a href={item.url.replace(baseUrl, '')} title={item.name} suppressHydrationWarning>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

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
