type SeoPingPayload = {
  urls: string[]
}

const DEFAULT_SITEWIDE_PATHS = ['/', '/vi', '/en', '/vi/shop', '/en/shop', '/vi/journal', '/en/journal']

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(/\/$/, '')
}

function toAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl()
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function postSeoPing(payload: SeoPingPayload): Promise<void> {
  try {
    await fetch('/api/seo/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch {

  }
}

function toAbsoluteUrls(paths: string[]): string[] {
  return paths.map((path) => toAbsoluteUrl(path))
}

export async function pingSitemapSeo(extraPaths: string[] = []): Promise<void> {
  await postSeoPing({
    urls: [toAbsoluteUrl('/sitemap.xml'), ...toAbsoluteUrls(extraPaths)],
  })
}

export async function pingSitewideSeo(): Promise<void> {
  await pingSitemapSeo(DEFAULT_SITEWIDE_PATHS)
}

export async function pingProductSeo(slug: string): Promise<void> {
  const encodedSlug = encodeURIComponent(slug)

  await pingSitemapSeo([`/vi/shop/${encodedSlug}`, `/en/shop/${encodedSlug}`])
}

export async function pingStorySeo(viSlug: string, enSlug: string): Promise<void> {
  const encodedViSlug = encodeURIComponent(viSlug)
  const encodedEnSlug = encodeURIComponent(enSlug)

  await pingSitemapSeo([`/vi/journal/${encodedViSlug}`, `/en/journal/${encodedEnSlug}`])
}
