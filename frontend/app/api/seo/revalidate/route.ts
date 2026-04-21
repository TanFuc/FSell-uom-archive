import { revalidatePath, revalidateTag } from 'next/cache'
import {
  SITEMAP_PRODUCTS_TAG,
  SITEMAP_STORIES_TAG,
  SITEMAP_STATIC_TAG,
} from '@/lib/sitemap-data'

type RevalidateRequestBody = {
  tags?: string[]
  paths?: string[]
  reason?: string
}

const DEFAULT_TAGS = [SITEMAP_PRODUCTS_TAG, SITEMAP_STORIES_TAG, SITEMAP_STATIC_TAG]
const DEFAULT_PATHS = ['/sitemap.xml', '/sitemaps/static.xml']

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

function isAuthorized(request: Request, body: RevalidateRequestBody): boolean {
  const secret = process.env.SITEMAP_REVALIDATE_SECRET?.trim()
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  const headerSecret = request.headers.get('x-revalidate-secret')?.trim()
  const bodySecret = (body as RevalidateRequestBody & { secret?: string }).secret?.trim()

  return headerSecret === secret || bodySecret === secret
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
    // no-op: never fail revalidation because monitoring endpoint is down.
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: RevalidateRequestBody = {}

  try {
    body = (await request.json()) as RevalidateRequestBody
  } catch {
    body = {}
  }

  if (!isAuthorized(request, body)) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const tags = normalizeStringList(body.tags)
  const paths = normalizeStringList(body.paths)

  const finalTags = tags.length > 0 ? tags : DEFAULT_TAGS
  const finalPaths = paths.length > 0 ? paths : DEFAULT_PATHS

  for (const tag of finalTags) {
    revalidateTag(tag)
  }

  for (const path of finalPaths) {
    revalidatePath(path)
  }

  const result = {
    success: true,
    message: 'Sitemap caches revalidated',
    reason: body.reason || 'manual',
    tags: finalTags,
    paths: finalPaths,
    revalidatedAt: new Date().toISOString(),
  }

  console.info('[seo:revalidate]', JSON.stringify(result))
  await emitMonitorLog({ event: 'seo_revalidate', level: 'info', ...result })

  return Response.json(result)
}
