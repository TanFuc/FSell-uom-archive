type SeoPingPayload = {
  urls: string[]
}

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

export async function pingProductSeo(slug: string): Promise<void> {
  const encodedSlug = encodeURIComponent(slug)

  await postSeoPing({
    urls: [
      toAbsoluteUrl('/sitemap.xml'),
      toAbsoluteUrl(`/vi/shop/${encodedSlug}`),
      toAbsoluteUrl(`/en/shop/${encodedSlug}`),
    ],
  })
}

export async function pingStorySeo(viSlug: string, enSlug: string): Promise<void> {
  const encodedViSlug = encodeURIComponent(viSlug)
  const encodedEnSlug = encodeURIComponent(enSlug)

  await postSeoPing({
    urls: [
      toAbsoluteUrl('/sitemap.xml'),
      toAbsoluteUrl(`/vi/journal/${encodedViSlug}`),
      toAbsoluteUrl(`/en/journal/${encodedEnSlug}`),
    ],
  })
}
