import { type MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://uomarchive.com'
const LOCALES = ['vi', 'en'] as const

async function fetchAllProductSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/products?page=1&limit=1000&isActive=true`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((p: { slug: string }) => p.slug)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllProductSlugs()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/${locale}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/${locale}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ])

  const productPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    slugs.map((slug) => ({
      url: `${BASE_URL}/${locale}/shop/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  )

  return [...staticPages, ...productPages]
}
