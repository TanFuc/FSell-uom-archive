import {
  BASE_URL,
  buildProductEntries,
  buildStaticEntries,
  buildStoryEntries,
  buildSitemapXml,
  fetchAllProducts,
  fetchStories,
  fetchSitemapSiteContent,
  SITEMAP_REVALIDATE,
  type SitemapUrlEntry,
} from '@/lib/sitemap-data'
import { parseSitePages } from '@/lib/site-structure'

export const revalidate = SITEMAP_REVALIDATE

export async function GET(): Promise<Response> {
  // Fetch all data sources in parallel.
  // Stories failures are NON-FATAL — we degrade gracefully to an empty story list
  // rather than serving a broken/empty sitemap that deindexes pages.
  const [productsResult, storiesResult, contentResult] = await Promise.allSettled([
    fetchAllProducts(),
    fetchStories(),
    fetchSitemapSiteContent(),
  ])

  const products = productsResult.status === 'fulfilled' ? productsResult.value : []
  const stories = storiesResult.status === 'fulfilled' ? storiesResult.value : []
  const pages = parseSitePages(contentResult.status === 'fulfilled' ? contentResult.value : {})
  const visible = (slug: string) => pages.find((page) => page.slug === slug)?.isVisible !== false

  if (productsResult.status === 'rejected') {
    console.error('[sitemap] fetchAllProducts failed:', productsResult.reason)
  }
  if (storiesResult.status === 'rejected') {
    console.warn(
      '[sitemap] fetchStories failed (non-fatal, stories omitted):',
      storiesResult.reason,
    )
  }

  // Merge all URL entries: static pages → product pages → journal pages
  const allEntries: SitemapUrlEntry[] = [
    ...buildStaticEntries(products, stories).filter((entry) => {
      const path = new URL(entry.loc).pathname
      const slug = path.split('/')[2] || 'home'
      return visible(slug)
    }),
    ...(visible('shop') ? buildProductEntries(products) : []),
    ...(visible('journal') ? buildStoryEntries(stories) : []),
    ...pages.filter((page) => page.isVisible && !['home', 'shop', 'about', 'journal', 'contact'].includes(page.slug)).flatMap((page) => ['vi', 'en'].map((locale) => ({
      loc: `${BASE_URL}/${locale}/pages/${encodeURIComponent(page.slug)}`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.5,
      alternates: {
        vi: `${BASE_URL}/vi/pages/${encodeURIComponent(page.slug)}`,
        en: `${BASE_URL}/en/pages/${encodeURIComponent(page.slug)}`,
        'x-default': `${BASE_URL}/vi/pages/${encodeURIComponent(page.slug)}`,
      },
    }))),
  ]

  // Deduplicate by canonical loc (keeps first occurrence = highest priority entries first)
  const seen = new Set<string>()
  const deduped = allEntries.filter((entry) => {
    const key = entry.loc.toLowerCase().replace(/\/$/, '') // normalize trailing slash
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Enforce canonical: all URLs must be https://www. — drop anything that isn't
  const canonical = deduped.filter(
    (entry) => entry.loc.startsWith(`${BASE_URL}/`) || entry.loc === BASE_URL,
  )

  console.info(`[sitemap] generated unified sitemap.xml: ${canonical.length} URLs`)

  return new Response(buildSitemapXml(canonical), {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': 'inline; filename="sitemap.xml"',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=3600',
      Vary: 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
