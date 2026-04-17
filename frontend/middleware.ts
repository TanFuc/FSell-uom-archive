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
  const pathname = request.nextUrl.pathname

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

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
