import { type MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(/\/$/, '')
const LOCALES = ['vi', 'en'] as const
const PAGE_SIZE = 200
const API_CANDIDATES = [
  process.env.SITEMAP_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'https://www.uomarchive.com/api',
  'https://uomarchive.com/api',
  'http://localhost:3001/api',
].filter((value): value is string => Boolean(value))

export const revalidate = 3600

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

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, '')
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

async function fetchAllProductsFromApi(apiUrl: string): Promise<Product[]> {
  const products: Product[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetch(`${apiUrl}/products?page=${page}&limit=${PAGE_SIZE}&isActive=true`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch products from ${apiUrl}`)
    }

    const payload = (await res.json()) as unknown
    const data = unwrapProductsResponse(payload)
    const currentPageItems = (data.data ?? [])
      .map((item) => parseProduct(item))
      .filter((item): item is Product => item !== null)

    products.push(...currentPageItems)

    totalPages = data.meta?.totalPages ?? page
    if (currentPageItems.length === 0) {
      break
    }

    page += 1
  }

  return products
}

async function fetchAllProducts(): Promise<Product[]> {
  for (const candidate of API_CANDIDATES) {
    const apiUrl = normalizeApiUrl(candidate)

    try {
      const products = await fetchAllProductsFromApi(apiUrl)
      if (products.length > 0) {
        return products
      }
    } catch {
      continue
    }
  }

  return []
}

function safeDate(value: string | null, fallback: Date): Date {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllProducts()
  const now = new Date()

  const getAlternates = (path: string) => ({
    languages: {
      vi: `${BASE_URL}/vi${path}`,
      en: `${BASE_URL}/en${path}`,
      'x-default': `${BASE_URL}/vi${path}`,
    },
  })

  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: getAlternates(''),
    },
    {
      url: `${BASE_URL}/${locale}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: getAlternates('/shop'),
    },
    {
      url: `${BASE_URL}/${locale}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: getAlternates('/about'),
    },
  ])

  const productPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    products.map((p) => ({
      url: `${BASE_URL}/${locale}/shop/${encodeURIComponent(p.slug)}`,
      lastModified: safeDate(p.updatedAt, now),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: getAlternates(`/shop/${encodeURIComponent(p.slug)}`),
      images: p.images,
    })),
  )

  return [...staticPages, ...productPages]
}
