import { getStorySlug, parseStories, STORIES_CONTENT_KEY, type StoryItem } from '@/lib/stories'

export const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(
  /\/$/,
  '',
)
export const LOCALES = ['vi', 'en'] as const
export const SITEMAP_REVALIDATE = 30
export const SITEMAP_CHUNK_SIZE = 1000
export const SITEMAP_PRODUCTS_TAG = 'sitemap-products'
export const SITEMAP_STORIES_TAG = 'sitemap-stories'
export const SITEMAP_STATIC_TAG = 'sitemap-static'
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.SITEMAP_FETCH_TIMEOUT_MS || '8000', 10)

const PAGE_SIZE = 200
const API_CANDIDATES = [
  process.env.SITEMAP_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'https://www.uomarchive.com/api',
  'https://uomarchive.com/api',
  'http://localhost:8888/api',
].filter((value): value is string => Boolean(value))

const API_URLS = Array.from(new Set(API_CANDIDATES.map((value) => value.replace(/\/$/, ''))))

type Product = {
  slug: string
  updatedAt: string | null
  images: string[]
}

type ProductsResponse = {
  data?: Array<{
    slug?: string
    updatedAt?: string
    image?: string
    images?: string[]
    hoverImage?: string
  }>
  meta?: {
    page?: number
    limit?: number
    totalPages?: number
  }
}

type SiteContentResponse = Record<string, unknown>

export type SitemapUrlEntry = {
  loc: string
  lastmod: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
  images?: string[]
  alternates?: Record<string, string>
}

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = Number.isFinite(FETCH_TIMEOUT_MS) && FETCH_TIMEOUT_MS > 0 ? FETCH_TIMEOUT_MS : 8000
  const timer = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

function unwrapProductsResponse(payload: unknown): ProductsResponse {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const root = payload as {
    data?: unknown
    meta?: ProductsResponse['meta']
  }

  if (Array.isArray(root.data)) {
    return { data: root.data as ProductsResponse['data'], meta: root.meta }
  }

  if (!root.data || typeof root.data !== 'object') {
    return {}
  }

  const nested = root.data as {
    data?: unknown
    meta?: ProductsResponse['meta']
  }

  if (Array.isArray(nested.data)) {
    return {
      data: nested.data as ProductsResponse['data'],
      meta: nested.meta,
    }
  }

  return {}
}

function toAbsoluteUrl(value: string): string {
  if (!value) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`
  return `${BASE_URL}${normalizedPath}`
}

function parseProduct(product: NonNullable<ProductsResponse['data']>[number]): Product | null {
  if (!product?.slug) {
    return null
  }

  const images = [product.image, ...(product.images ?? []), product.hoverImage]
    .filter((value): value is string => Boolean(value))
    .map((value) => toAbsoluteUrl(value))

  return {
    slug: product.slug,
    updatedAt: product.updatedAt ?? null,
    images,
  }
}

function safeDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed
}

function toIsoDate(value: string | null | undefined, fallback: Date): string {
  return safeDate(value, fallback).toISOString()
}

function dedupeProducts(products: Product[]): Product[] {
  const bySlug = new Map<string, Product>()

  for (const product of products) {
    const existing = bySlug.get(product.slug)
    if (!existing) {
      bySlug.set(product.slug, {
        ...product,
        images: Array.from(new Set(product.images)),
      })
      continue
    }

    const existingUpdated = safeDate(existing.updatedAt, new Date(0)).getTime()
    const incomingUpdated = safeDate(product.updatedAt, new Date(0)).getTime()
    const winner = incomingUpdated >= existingUpdated ? product : existing

    bySlug.set(product.slug, {
      slug: winner.slug,
      updatedAt: winner.updatedAt ?? existing.updatedAt,
      images: Array.from(new Set([...existing.images, ...product.images])),
    })
  }

  return Array.from(bySlug.values())
}

async function fetchAllProductsFromApi(apiUrl: string): Promise<Product[]> {
  const products: Product[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetchWithTimeout(
      `${apiUrl}/products?page=${page}&limit=${PAGE_SIZE}&isActive=true`,
      {
        next: {
          revalidate: SITEMAP_REVALIDATE,
          tags: [SITEMAP_PRODUCTS_TAG, SITEMAP_STATIC_TAG],
        },
      },
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch products from ${apiUrl}`)
    }

    const payload = (await res.json()) as unknown
    const data = unwrapProductsResponse(payload)
    const currentPageItems = (data.data ?? [])
      .map((item) => parseProduct(item))
      .filter((item): item is Product => item !== null)

    products.push(...currentPageItems)

    const reportedTotalPages = data.meta?.totalPages ?? page
    totalPages = Math.max(totalPages, reportedTotalPages)

    if (currentPageItems.length === 0) {
      break
    }

    page += 1
  }

  return products
}

export async function fetchAllProducts(): Promise<Product[]> {
  let bestProducts: Product[] = []
  let hasSuccessfulSource = false

  for (const apiUrl of API_URLS) {
    try {
      const products = dedupeProducts(await fetchAllProductsFromApi(apiUrl))
      hasSuccessfulSource = true
      if (products.length > bestProducts.length) {
        bestProducts = products
      }
    } catch (error) {
      console.warn(
        `[sitemap] products source failed: ${apiUrl}`,
        error instanceof Error ? error.message : String(error),
      )
      continue
    }
  }

  if (!hasSuccessfulSource) {
    throw new Error('[sitemap] failed to fetch products from all configured API sources')
  }

  return bestProducts
}

async function fetchSiteContentFromApi(apiUrl: string): Promise<SiteContentResponse | null> {
  const res = await fetchWithTimeout(`${apiUrl}/settings/site-content`, {
    next: {
      revalidate: SITEMAP_REVALIDATE,
      tags: [SITEMAP_STORIES_TAG, SITEMAP_STATIC_TAG],
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch site content from ${apiUrl}`)
  }

  const payload = (await res.json()) as unknown
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const root = payload as { data?: unknown }
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as SiteContentResponse
  }

  return payload as SiteContentResponse
}

function stripLoneSurrogates(value: string): string {
  return value.replace(
    /([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/g,
    '$2',
  )
}

function safeEncodePathSegment(value: string): string {
  try {
    return encodeURIComponent(value)
  } catch {
    return encodeURIComponent(stripLoneSurrogates(value))
  }
}
export async function fetchStories(): Promise<StoryItem[]> {
  let bestStories = parseStories(undefined)
  let hasSuccessfulSource = false

  for (const apiUrl of API_URLS) {
    try {
      const siteContent = await fetchSiteContentFromApi(apiUrl)
      hasSuccessfulSource = true
      const stories = parseStories(siteContent?.[STORIES_CONTENT_KEY]).filter(
        (story) => story.isVisible !== false,
      )
      if (stories.length > bestStories.length) {
        bestStories = stories
      }
    } catch (error) {
      console.warn(
        `[sitemap] stories source failed: ${apiUrl}`,
        error instanceof Error ? error.message : String(error),
      )
      continue
    }
  }

  if (!hasSuccessfulSource) {
    throw new Error('[sitemap] failed to fetch stories from all configured API sources')
  }

  return bestStories
}

function getLatestDate(values: Array<string | null | undefined>, fallback: Date): Date {
  let latest = fallback

  for (const value of values) {
    const parsed = safeDate(value, fallback)
    if (parsed.getTime() > latest.getTime()) {
      latest = parsed
    }
  }

  return latest
}

function getLocaleAlternates(path: string): Record<string, string> {
  return {
    vi: `${BASE_URL}/vi${path}`,
    en: `${BASE_URL}/en${path}`,
    'x-default': `${BASE_URL}/vi${path}`,
  }
}

export function buildStaticEntries(products: Product[], stories: StoryItem[]): SitemapUrlEntry[] {
  const now = new Date()
  const latestProductDate = getLatestDate(products.map((item) => item.updatedAt), now)
  const latestStoryDate = getLatestDate(
    stories.map((item) => item.updatedAt ?? item.publishedAt),
    now,
  )
  const latestContentDate =
    latestProductDate.getTime() > latestStoryDate.getTime() ? latestProductDate : latestStoryDate

  return [
    {
      loc: BASE_URL,
      lastmod: latestContentDate.toISOString(),
      changefreq: 'daily',
      priority: 1,
    },
    ...LOCALES.flatMap((locale) => [
      {
        loc: `${BASE_URL}/${locale}`,
        lastmod: latestContentDate.toISOString(),
        changefreq: 'daily' as const,
        priority: 1,
        alternates: getLocaleAlternates(''),
      },
      {
        loc: `${BASE_URL}/${locale}/shop`,
        lastmod: latestProductDate.toISOString(),
        changefreq: 'daily' as const,
        priority: 0.9,
        alternates: getLocaleAlternates('/shop'),
      },
      {
        loc: `${BASE_URL}/${locale}/about`,
        lastmod: latestContentDate.toISOString(),
        changefreq: 'monthly' as const,
        priority: 0.6,
        alternates: getLocaleAlternates('/about'),
      },
      {
        loc: `${BASE_URL}/${locale}/journal`,
        lastmod: latestStoryDate.toISOString(),
        changefreq: 'daily' as const,
        priority: 0.75,
        alternates: getLocaleAlternates('/journal'),
      },
    ]),
  ]
}

export function buildProductEntries(products: Product[]): SitemapUrlEntry[] {
  const now = new Date()

  return LOCALES.flatMap((locale) =>
    products.map((product) => {
      const encodedSlug = safeEncodePathSegment(product.slug)
      return {
        loc: `${BASE_URL}/${locale}/shop/${encodedSlug}`,
        lastmod: toIsoDate(product.updatedAt, now),
        changefreq: 'daily' as const,
        priority: 0.8,
        alternates: getLocaleAlternates(`/shop/${encodedSlug}`),
        images: product.images,
      }
    }),
  )
}

export function buildStoryEntries(stories: StoryItem[]): SitemapUrlEntry[] {
  const now = new Date()

  return stories.flatMap((story) => {
    const viSlug = safeEncodePathSegment(getStorySlug(story, 'vi'))
    const enSlug = safeEncodePathSegment(getStorySlug(story, 'en'))
    const lastmod = toIsoDate(story.updatedAt ?? story.publishedAt, now)
    const image = story.imageUrl ? [toAbsoluteUrl(story.imageUrl)] : undefined

    return [
      {
        loc: `${BASE_URL}/vi/journal/${viSlug}`,
        lastmod,
        changefreq: 'daily' as const,
        priority: 0.75,
        alternates: {
          vi: `${BASE_URL}/vi/journal/${viSlug}`,
          en: `${BASE_URL}/en/journal/${enSlug}`,
          'x-default': `${BASE_URL}/vi/journal/${viSlug}`,
        },
        images: image,
      },
      {
        loc: `${BASE_URL}/en/journal/${enSlug}`,
        lastmod,
        changefreq: 'daily' as const,
        priority: 0.75,
        alternates: {
          vi: `${BASE_URL}/vi/journal/${viSlug}`,
          en: `${BASE_URL}/en/journal/${enSlug}`,
          'x-default': `${BASE_URL}/vi/journal/${viSlug}`,
        },
        images: image,
      },
    ]
  })
}

export function chunkEntries<T>(entries: T[], chunkSize = SITEMAP_CHUNK_SIZE): T[][] {
  if (entries.length === 0) {
    return []
  }

  const chunks: T[][] = []
  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(entries.slice(i, i + chunkSize))
  }

  return chunks
}

function escapeXml(value: string): string {
  return stripLoneSurrogates(value)
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const alternates = entry.alternates
        ? Object.entries(entry.alternates)
            .map(
              ([lang, href]) =>
                `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`,
            )
            .join('\n')
        : ''

      const images = (entry.images ?? [])
        .map(
          (image) =>
            `    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n    </image:image>`,
        )
        .join('\n')

      const inner = [
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        alternates,
        images,
      ]
        .filter((value) => value.length > 0)
        .join('\n')

      return `  <url>\n${inner}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`
}

export function buildSitemapIndexXml(items: Array<{ loc: string; lastmod: string }>): string {
  const body = items
    .map(
      (item) =>
        `  <sitemap>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>\n  </sitemap>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`
}