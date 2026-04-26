import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
})

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  const { pathname, search } = request.nextUrl

  // 1. Force WWW redirection for SEO consistency
  if (host && host === 'uomarchive.com') {
    return NextResponse.redirect(`https://www.uomarchive.com${pathname}${search}`, 301)
  }

  if (pathname.includes('sitemap') || pathname.endsWith('.xml')) {
    return NextResponse.next()
  }

  const isAdminRoute = pathname.match(/^\/[a-z]{2}\/admin(?!\/login)/)
  const isLoginPage = pathname.match(/^\/[a-z]{2}\/admin\/login/)

  if (isAdminRoute && !isLoginPage) {
    const token = request.cookies.get('accessToken')?.value

    if (!token) {
      const locale = pathname.split('/')[1] || defaultLocale
      const loginUrl = new URL(`/${locale}/admin/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = intlMiddleware(request)

  // Force public caching for non-admin localized pages.
  // Using shorter max-age during SEO recovery to ensure Google sees fresh ALT tags.
  if (response instanceof Response && response.status === 200 && !isAdminRoute) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300')
    response.headers.set('X-Robots-Tag', 'index, follow')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
