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
  const isUnlocalizedAdminRoute = /^\/admin(?:\/|$)/.test(pathname)
  const isSeoSystemRoute =
    pathname.includes('sitemap') ||
    pathname.endsWith('.xml') ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json'
  const isPreviewRoute = /^\/[a-z]{2}\/page-new(?:\/)?$/.test(pathname)
  const isAdminRoute = /^\/[a-z]{2}\/admin(?!\/login)/.test(pathname)
  const isAdminAnyRoute = /^\/[a-z]{2}\/admin(?:\/|$)/.test(pathname)
  const isLoginPage = /^\/[a-z]{2}\/admin\/login/.test(pathname)
  const isPublicLocalizedRoute =
    pathname === '/vi' ||
    pathname === '/en' ||
    /^\/(vi|en)\/(shop|about|journal)(?:\/[^/]+)?\/?$/.test(pathname)

  // 1. Force WWW redirection for SEO consistency
  if (host && host === 'uomarchive.com') {
    return NextResponse.redirect(`https://www.uomarchive.com${pathname}${search}`, 301)
  }

  if (isUnlocalizedAdminRoute) {
    return NextResponse.redirect(new URL(`/vi${pathname}${search}`, request.url), 307)
  }

  if (isSeoSystemRoute) {
    return NextResponse.next()
  }

  if (isAdminRoute && !isLoginPage) {
    const token = request.cookies.get('accessToken')?.value

    if (!token) {
      const locale = pathname.split('/')[1] ?? defaultLocale
      const loginUrl = new URL(`/${locale}/admin/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = intlMiddleware(request)

  // Force public caching only for canonical public localized pages.
  // Using shorter max-age during SEO recovery to ensure Google sees fresh ALT tags.
  if (response instanceof Response && response.status === 200 && isPublicLocalizedRoute) {
    const sitemapUrl = new URL('/sitemap.xml', request.url)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300')
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.append('Link', `<${sitemapUrl.href}>; rel="sitemap"; type="application/xml"`)
  }

  if (
    response instanceof Response &&
    response.status === 200 &&
    (isAdminAnyRoute || isPreviewRoute)
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'private, no-store')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
