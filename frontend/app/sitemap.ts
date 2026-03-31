import { type MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://uomarchive.com'
const LOCALES = ['vi', 'en'] as const

async function fetchAllProducts(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_URL}/products?page=1&limit=1000&isActive=true`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((p: { slug: string; updatedAt: string }) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllProducts()
  const now = new Date()

  const getAlternates = (path: string) => ({
    languages: {
      vi: `${BASE_URL}/vi${path}`,
      en: `${BASE_URL}/en${path}`,
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
      url: `${BASE_URL}/${locale}/shop/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: getAlternates(`/shop/${p.slug}`),
    })),
  )

  return [...staticPages, ...productPages]
}
