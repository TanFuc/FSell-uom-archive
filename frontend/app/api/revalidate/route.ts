import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

type RevalidatePayload = {
  path?: string
  tag?: string
  secret?: string
}

function isAuthorized(request: NextRequest, body: RevalidatePayload): boolean {
  const secret = process.env.SITEMAP_REVALIDATE_SECRET?.trim()

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  const headerSecret = request.headers.get('x-revalidate-secret')?.trim()
  return headerSecret === secret || body.secret?.trim() === secret
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidatePayload
    const { path, tag } = body

    if (!isAuthorized(request, body)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (path) {
      // Revalidate language-specific paths
      revalidatePath(`/[locale]${path}`, 'page')
      revalidatePath(path)

      // Also revalidate sitemaps
      revalidatePath('/sitemap.xml')
      revalidatePath('/sitemaps/[name]', 'page')
    }

    if (tag) {
      revalidateTag(tag)
    }

    return Response.json({
      revalidated: true,
      now: Date.now(),
      message: `Revalidated path: ${path || 'none'}, tag: ${tag || 'none'}`,
    })
  } catch (err) {
    return Response.json({ message: 'Error revalidating', error: err }, { status: 500 })
  }
}
