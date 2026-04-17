import {
  BASE_URL,
  buildProductEntries,
  buildSitemapIndexXml,
  buildStoryEntries,
  chunkEntries,
  fetchAllProducts,
  fetchStories,
  SITEMAP_CHUNK_SIZE,
  SITEMAP_REVALIDATE,
} from '@/lib/sitemap-data'

export const revalidate = SITEMAP_REVALIDATE

export async function GET(): Promise<Response> {
  const nowIso = new Date().toISOString()
  const [products, stories] = await Promise.all([fetchAllProducts(), fetchStories()])

  const productChunkCount = Math.max(1, chunkEntries(buildProductEntries(products), SITEMAP_CHUNK_SIZE).length)
  const storyChunkCount = Math.max(1, chunkEntries(buildStoryEntries(stories), SITEMAP_CHUNK_SIZE).length)

  const items: Array<{ loc: string; lastmod: string }> = [
    { loc: `${BASE_URL}/sitemaps/static.xml`, lastmod: nowIso },
    ...Array.from({ length: productChunkCount }, (_, index) => ({
      loc: `${BASE_URL}/sitemaps/products-${index + 1}.xml`,
      lastmod: nowIso,
    })),
    ...Array.from({ length: storyChunkCount }, (_, index) => ({
      loc: `${BASE_URL}/sitemaps/journal-${index + 1}.xml`,
      lastmod: nowIso,
    })),
  ]

  return new Response(buildSitemapIndexXml(items), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}