import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

type RevalidatePayload = {
  path?: string
  paths?: string[]
  tag?: string
  secret?: string
}

function isAuthorized(request: NextRequest, body: RevalidatePayload): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const secret = (
    process.env.SITEMAP_REVALIDATE_SECRET ||
    process.env.NEXT_PUBLIC_SITEMAP_REVALIDATE_SECRET
  )?.trim()

  const headerSecret = request.headers.get('x-revalidate-secret')?.trim()
  if (secret && (headerSecret === secret || body.secret?.trim() === secret)) {
    return true
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const authHeader = request.headers.get('authorization') || ''
  if (cookieHeader.includes('accessToken=') || authHeader.startsWith('Bearer ')) {
    return true
  }

  if (!secret) {
    return true
  }

  return false
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
