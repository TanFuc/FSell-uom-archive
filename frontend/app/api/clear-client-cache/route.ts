import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getServerApiUrl } from '@/lib/server-utils'

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('accessToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const newVersion = `v${Date.now()}`
    const apiUrl = getServerApiUrl()

    const secret =
      process.env.REVALIDATE_SECRET ||
      process.env.SITEMAP_REVALIDATE_SECRET ||
      'dev-sitemap-revalidate-secret'

    // 1. Update backend site_content table with new version
    try {
      const backendRes = await fetch(`${apiUrl}/settings/client-cache-version`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': secret,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          version: newVersion,
        }),
      })

      if (!backendRes.ok) {
        // Fallback to site-content endpoint
        await fetch(`${apiUrl}/settings/site-content`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-revalidate-secret': secret,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            'system.client_cache_version': newVersion,
          }),
        })
      }
    } catch (dbErr) {
      console.warn('[clear-client-cache] Failed to persist to backend, continuing revalidate:', dbErr)
    }

    // 2. Revalidate Next.js internal server-side paths and layouts
    try {
      revalidateTag('site-content')
      revalidatePath('/', 'layout')
      revalidatePath('/[locale]', 'layout')
      revalidatePath('/vi', 'layout')
      revalidatePath('/en', 'layout')
      revalidatePath('/vi/shop', 'layout')
      revalidatePath('/en/shop', 'layout')
      revalidatePath('/vi/journal', 'layout')
      revalidatePath('/en/journal', 'layout')
      revalidatePath('/vi/about', 'layout')
      revalidatePath('/en/about', 'layout')
    } catch (revalErr) {
      console.warn('[clear-client-cache] Revalidation error:', revalErr)
    }

    // 3. Return response with Clear-Site-Data header to purge local cache immediately
    const response = NextResponse.json({
      success: true,
      version: newVersion,
      timestamp: Date.now(),
      message: 'Client cache version successfully updated and server revalidated',
    })

    response.headers.set('Clear-Site-Data', '"cache"')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return response
  } catch (error: any) {
    console.error('[clear-client-cache] Error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to clear client cache' },
      { status: 500 },
    )
  }
}
