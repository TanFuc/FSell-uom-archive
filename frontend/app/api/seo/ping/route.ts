type PingRequestBody = {
  urls?: string[]
}

type PingResult = {
  provider: string
  ok: boolean
  status?: number
  error?: string
}

function normalizeBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(/\/$/, '')
}

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function limitUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of urls) {
    if (!isValidAbsoluteUrl(value)) continue
    if (seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
    if (normalized.length >= 500) break
  }

  return normalized
}

async function pingIndexNow(baseUrl: string, urls: string[]): Promise<PingResult> {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    return { provider: 'indexnow', ok: false, error: 'INDEXNOW_KEY is not configured' }
  }

  const host = new URL(baseUrl).hostname
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION || `${baseUrl}/${encodeURIComponent(key)}.txt`

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: urls,
      }),
    })

    return {
      provider: 'indexnow',
      ok: response.ok,
      status: response.status,
      ...(response.ok ? {} : { error: 'IndexNow request failed' }),
    }
  } catch (error) {
    return {
      provider: 'indexnow',
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function pingBingSitemap(baseUrl: string): Promise<PingResult> {
  const sitemapUrl = `${baseUrl}/sitemap.xml`

  try {
    const response = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    )

    return {
      provider: 'bing-sitemap-ping',
      ok: response.ok,
      status: response.status,
      ...(response.ok ? {} : { error: 'Bing sitemap ping failed' }),
    }
  } catch (error) {
    return {
      provider: 'bing-sitemap-ping',
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  let payload: PingRequestBody

  try {
    payload = (await request.json()) as PingRequestBody
  } catch {
    return Response.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 })
  }

  const urls = limitUrls(payload.urls ?? [])
  if (urls.length === 0) {
    return Response.json({ success: false, message: 'No valid URLs provided' }, { status: 400 })
  }

  const baseUrl = normalizeBaseUrl()
  const results = await Promise.all([pingIndexNow(baseUrl, urls), pingBingSitemap(baseUrl)])

  return Response.json({
    success: results.some((result) => result.ok),
    submittedUrls: urls.length,
    results,
  })
}
