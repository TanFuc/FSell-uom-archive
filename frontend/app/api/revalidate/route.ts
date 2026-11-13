import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { path, tag } = await request.json()

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
