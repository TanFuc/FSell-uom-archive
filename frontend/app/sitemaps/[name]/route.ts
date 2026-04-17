import {
  buildProductEntries,
  buildSitemapXml,
  buildStaticEntries,
  buildStoryEntries,
  chunkEntries,
  fetchAllProducts,
  fetchStories,
  SITEMAP_CHUNK_SIZE,
  SITEMAP_REVALIDATE,
  type SitemapUrlEntry,
} from '@/lib/sitemap-data'

export const revalidate = SITEMAP_REVALIDATE

interface Params {
  params: {
    name: string
  }
}

function parseChunkName(name: string):
  | { kind: 'static' }
  | { kind: 'products'; chunkIndex: number }
  | { kind: 'journal'; chunkIndex: number }
  | null {
  if (name === 'static.xml') {
    return { kind: 'static' }
  }

  const productsMatch = name.match(/^products-(\d+)\.xml$/i)
  if (productsMatch) {
    const chunkIndex = Number.parseInt(productsMatch[1], 10)
    return Number.isNaN(chunkIndex) || chunkIndex < 1 ? null : { kind: 'products', chunkIndex }
  }

  const journalMatch = name.match(/^journal-(\d+)\.xml$/i)
  if (journalMatch) {
    const chunkIndex = Number.parseInt(journalMatch[1], 10)
    return Number.isNaN(chunkIndex) || chunkIndex < 1 ? null : { kind: 'journal', chunkIndex }
  }

  return null
}

function getChunkOrEmpty<T>(chunks: T[][], chunkIndex: number): T[] {
  return chunks[chunkIndex - 1] ?? []
}

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const parsed = parseChunkName(params.name)

  if (!parsed) {
    return new Response('Not found', { status: 404 })
  }

  const [products, stories] = await Promise.all([fetchAllProducts(), fetchStories()])

  let entries: SitemapUrlEntry[] = []

  if (parsed.kind === 'static') {
    entries = buildStaticEntries(products, stories)
  } else if (parsed.kind === 'products') {
    const chunks = chunkEntries(buildProductEntries(products), SITEMAP_CHUNK_SIZE)
    entries = getChunkOrEmpty(chunks, parsed.chunkIndex)
  } else {
    const chunks = chunkEntries(buildStoryEntries(stories), SITEMAP_CHUNK_SIZE)
    entries = getChunkOrEmpty(chunks, parsed.chunkIndex)
  }

  return new Response(buildSitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}