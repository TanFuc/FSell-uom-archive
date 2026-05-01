import type { MetadataRoute } from 'next'
import { getCanonicalBaseUrl, getCanonicalHost } from '@/lib/seo'

const BASE_URL = getCanonicalBaseUrl()
const CANONICAL_HOST = getCanonicalHost()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/vi/admin/', '/en/admin/', '/api/'],
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/vi/admin/', '/en/admin/', '/api/'],
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'OAI-SearchBot', disallow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: CANONICAL_HOST,
  }
}