import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

type RevalidatePayload = {
  path?: string
  paths?: string[]
  tag?: string
  secret?: string
}

function isAuthorized(request: NextRequest, body: RevalidatePayload): boolean {
  const secret = process.env.SITEMAP_REVALIDATE_SECRET?.trim()

  if (!secret) {
    return true
  }

  const headerSecret = request.headers.get('x-revalidate-secret')?.trim()
  return headerSecret === secret || body.secret?.trim() === secret
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RevalidatePayload
    const { path, paths, tag } = body

    if (!isAuthorized(request, body)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allPaths = paths && paths.length > 0 ? paths : path ? [path] : ['/']

    for (const p of allPaths) {
      const normalizedPath = p === '/' ? '' : p
      revalidatePath(`/[locale]${normalizedPath}`, 'page')
      revalidatePath(`/[locale]${normalizedPath}`, 'layout')
      revalidatePath(`/vi${normalizedPath}`, 'page')
      revalidatePath(`/en${normalizedPath}`, 'page')
      revalidatePath(p, 'page')
    }

    revalidatePath('/[locale]', 'layout')
    revalidatePath('/sitemap.xml')
    revalidatePath('/sitemaps/[name]', 'page')

    if (tag) {
      revalidateTag(tag)
    }

    return Response.json({
      revalidated: true,
      now: Date.now(),
      paths: allPaths,
    })
  } catch (err) {
    return Response.json({ message: 'Error revalidating', error: err }, { status: 500 })
  }
}

