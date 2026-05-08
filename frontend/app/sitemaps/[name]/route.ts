import { NextResponse } from 'next/server'
import { BASE_URL } from '@/lib/sitemap-data'

// Sub-sitemaps (static.xml, products-1.xml, journal-1.xml) are DEPRECATED.
// We now use a single unified /sitemap.xml.
// This handler redirects any crawler that still has the old sub-sitemap URLs
// (e.g. from a previously submitted sitemap index in Google Search Console)
// to the canonical sitemap so no URL is ever orphaned.
export async function GET(): Promise<Response> {
  return NextResponse.redirect(`${BASE_URL}/sitemap.xml`, {
    status: 301,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
