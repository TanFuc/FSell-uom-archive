import { revalidatePath, revalidateTag } from 'next/cache'
import { getCanonicalBaseUrl } from '@/lib/seo'
import { SITEMAP_PRODUCTS_TAG, SITEMAP_STATIC_TAG, SITEMAP_STORIES_TAG } from '@/lib/sitemap-data'

type PingRequestBody = {
  urls?: string[]
}

type PingResult = {
  provider: string
  ok: boolean
  status?: number
  error?: string
}

const DEFAULT_REVALIDATE_TAGS = [SITEMAP_PRODUCTS_TAG, SITEMAP_STORIES_TAG, SITEMAP_STATIC_TAG]
const DEFAULT_REVALIDATE_PATHS = ['/sitemap.xml', '/sitemaps/static.xml']

function normalizeBaseUrl(): string {
  return getCanonicalBaseUrl()
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

async function emitMonitorLog(payload: Record<string, unknown>): Promise<void> {
  const monitorWebhook = process.env.SEO_PING_MONITOR_WEBHOOK_URL?.trim()
  if (!monitorWebhook) {
    return
  }

  try {
    await fetch(monitorWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })
  } catch {
    // no-op: monitoring should not break ping endpoint.
  }
}

function revalidateSitemapCaches(): { tags: string[]; paths: string[] } {
  for (const tag of DEFAULT_REVALIDATE_TAGS) {
    revalidateTag(tag)
  }

  for (const path of DEFAULT_REVALIDATE_PATHS) {
    revalidatePath(path)
  }

  return {
    tags: DEFAULT_REVALIDATE_TAGS,
    paths: DEFAULT_REVALIDATE_PATHS,
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
  const failedResults = results.filter((result) => !result.ok)
  const revalidated = revalidateSitemapCaches()

  if (failedResults.length > 0) {
    const failureLog = {
      event: 'seo_ping_failure',
      level: 'error',
      submittedUrls: urls.length,
      failedProviders: failedResults,
      at: new Date().toISOString(),
    }

    console.error('[seo:ping] failure', JSON.stringify(failureLog))
    await emitMonitorLog(failureLog)
  }

  return Response.json({
    success: results.some((result) => result.ok),
    submittedUrls: urls.length,
    results,
    revalidated,
  })
}
