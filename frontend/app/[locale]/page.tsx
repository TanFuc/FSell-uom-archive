import { type Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { fetchBranding } from '@/lib/server-utils'
import { type Product } from '@/lib/sitemap-data'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY } from '@/lib/stories'
import HomeClient from './home-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com'
export const revalidate = 0 // Force fresh data during SEO recovery

async function fetchHomeSsrData() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // Tăng lên 10 giây để chắc chắn có dữ liệu cho Google

    const fetchOptions = {
      next: { revalidate: 0 },
      signal: controller.signal,
    }

    const [productsRes, contentRes] = await Promise.all([
      fetch(`${API_URL}/products?page=1&limit=8&isActive=true`, fetchOptions),
      fetch(`${API_URL}/settings/site-content`, fetchOptions),
    ])

    clearTimeout(timeoutId)

    const productsData = productsRes.ok ? await productsRes.json() : null
    const contentData = contentRes.ok ? await contentRes.json() : null

    // Helper to unwrap nested data if needed
    const products = (productsData?.data?.data || productsData?.data || []) as Product[]
    const stories = parseStories(
      contentData?.data?.[STORIES_CONTENT_KEY] || contentData?.[STORIES_CONTENT_KEY],
    ).filter((s) => s.isVisible !== false)

    console.info(`[SEO] SSR Data fetched: ${products.length} products, ${stories.length} stories`)
    return {
      products: { data: products.slice(0, 8), meta: { totalItems: products.length } },
      siteContent: contentData?.data || contentData || {},
      stories: stories.slice(0, 4),
    }
  } catch (error) {
    console.error('[SEO] SSR fetch failed or timed out:', error)
    return { products: { data: [], meta: {} }, siteContent: {}, stories: [] }
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const siteTitle = isVi
    ? (branding?.siteTitleVi ?? 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam')
    : (branding?.siteTitleEn ?? 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam')
  const description = isVi
    ? (branding?.siteDescriptionVi ?? 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.')
    : (branding?.siteDescriptionEn ?? 'Discover timeless Vietnamese ceramics curated with care.')
  const logo = branding?.logoUrl || `${BASE_URL}/assets/logo.png`

  return {
    title: { absolute: siteTitle },
    description,
    openGraph: {
      title: siteTitle,
      description,
      url: `${BASE_URL}/${locale}`,
      type: 'website',
      images: [{ url: logo, width: 1200, height: 630, alt: siteTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      images: [logo],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { vi: '/vi', en: '/en', 'x-default': '/vi' },
    },
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const brandingPromise = fetchBranding()
  const ssrDataPromise = fetchHomeSsrData()

  const [branding, ssrData] = await Promise.all([brandingPromise, ssrDataPromise])

  const logo = branding?.logoUrl || `${BASE_URL}/assets/logo.png`
  const name = branding?.brandNameVi || 'ƯƠM. Archive'
  const description =
    branding?.siteDescriptionVi || 'Gốm sứ thủ công Việt Nam — Vietnamese Handcrafted Ceramics'

  const isVi = locale === 'vi'

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
            name: name,
            url: 'https://www.uomarchive.com',
            logo: logo,
            sameAs: [],
            description: description,
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
            name,
            url: `${BASE_URL}/${locale}`,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${BASE_URL}/${locale}/shop?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* SEO Server-Side Content Summary - Hidden from users, visible to bots */}
      <section className="sr-only" suppressHydrationWarning>
        <h1 suppressHydrationWarning>
          {isVi ? branding?.siteTitleVi || name : branding?.siteTitleEn || name}
        </h1>
        <p suppressHydrationWarning>
          {isVi ? branding?.siteDescriptionVi : branding?.siteDescriptionEn}
        </p>

        {ssrData.products.data.length > 0 && (
          <div suppressHydrationWarning>
            <h2 suppressHydrationWarning>{isVi ? 'Sản phẩm mới' : 'New Arrivals'}</h2>
            <ul suppressHydrationWarning>
              {ssrData.products.data.map((p) => (
                <li key={p.id} suppressHydrationWarning>
                  <Link href={`/${locale}/shop/${p.slug}`} suppressHydrationWarning>
                    {isVi ? p.nameVi : p.nameEn} - {p.priceVND.toLocaleString('vi-VN')} VND
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
              {ssrData.stories.map((s) => (
                <li key={s.id} suppressHydrationWarning>
                  <a
                    href={`/${locale}/journal/${getStorySlug(s, locale as 'vi' | 'en')}`}
                    suppressHydrationWarning
                  >
                    {isVi ? s.titleVi : s.titleEn}
                  </a>
                  <p suppressHydrationWarning>{isVi ? s.summaryVi : s.summaryEn}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <HomeClient initialProducts={ssrData.products} initialSiteContent={ssrData.siteContent} />
    </>
  )
}
