import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Montserrat } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { Toaster as SonnerToaster } from 'sonner'
import { DisableRightClick } from '@/components/DisableRightClick'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ConfirmationProvider } from '@/components/providers/ConfirmationProvider'
import { Toaster } from '@/components/ui/toaster'
import { CustomerAuthModal } from '@/components/customer/CustomerAuthModal'
import { CustomerSocialAuthListener } from '@/components/customer/CustomerSocialAuthListener'
import { locales } from '@/i18n'
import {
  buildAbsoluteUrl,
  getCanonicalBaseUrl,
  getSeoBrandName,
  getSeoSiteDescription,
  getSeoSiteTitle,
  getSeoSocialImageUrl,
} from '@/lib/seo'
import { fetchBranding, fetchSiteContentServer } from '@/lib/server-utils'
import '@/styles/globals.css'
import '@/styles/loading-animations.css'

const abcArizona = localFont({
  src: [
    {
      path: '../../public/fonts/VL ABCArizonaFlare-Thin.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-Thin.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-ThinItalic.otf',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-ThinItalic.otf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-Light.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-LightItalic.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-RegIta.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-RegIta.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-RegIta.otf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/VL ABCArizonaFlare-RegIta.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-arizona',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const branding = await fetchBranding()
  const baseUrl = getCanonicalBaseUrl()
  const defaultTitle = getSeoSiteTitle(locale, branding)
  const brandName = getSeoBrandName(locale, branding)
  const description = getSeoSiteDescription(locale, branding)
  const previewImageUrl = buildAbsoluteUrl(getSeoSocialImageUrl(branding), baseUrl)

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${brandName}`,
    },
    description,
    keywords: [
      'gốm sứ thủ công',
      'vietnamese ceramics',
      'đồ trang trí gốm',
      'lifestyle vietnam',
      'handmade pottery',
      'nghệ thuật gốm',
      'ceramic archive',
      'ƯƠM.',
      'decor gốm sứ',
      'quà tặng gốm sứ',
      'craftsmanship vietnam',
    ],
    authors: [{ name: brandName }],
    creator: brandName,
    publisher: brandName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: `${baseUrl}/${locale}`,
      title: defaultTitle,
      description,
      siteName: brandName,
      images: [
        {
          url: previewImageUrl,
          alt: `${brandName} Logo`,
          width: 1200,
          height: 630,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description,
      images: [previewImageUrl],
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      shortcut: [{ url: '/favicon.ico' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: '/vi',
        en: '/en',
        'x-default': '/vi',
      },
    },
  }
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  unstable_setRequestLocale(locale)
  const siteContent = await fetchSiteContentServer()
  let messages: any = {}
  try {
    messages = await getMessages({ locale })
  } catch {
    try {
      messages = (await import(`@/messages/${locale}.json`)).default
    } catch {}
  }

  const clientCacheVersion = siteContent['system.client_cache_version'] || 'v1.0'

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.uomarchive.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.uomarchive.com" />
        <link rel="preconnect" href="https://api.uomarchive.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.uomarchive.com" />
        <script
          id="uom-cache-buster"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=${JSON.stringify(
              clientCacheVersion,
            )};var k='uom_ui_cache_version';var s=localStorage.getItem(k);if(s!==v){if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(r){for(var i=0;i<r.length;i++){r[i].unregister();}});}if('caches'in window){caches.keys().then(function(c){for(var j=0;j<c.length;j++){caches.delete(c[j]);}});}try{var t=localStorage.getItem('accessToken');var rt=localStorage.getItem('refreshToken');var cs=localStorage.getItem('uom-customer-storage');sessionStorage.clear();if(t)localStorage.setItem('accessToken',t);if(rt)localStorage.setItem('refreshToken',rt);if(cs)localStorage.setItem('uom-customer-storage',cs);}catch(e){}localStorage.setItem(k,v);}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${abcArizona.variable} ${montserrat.variable} flex min-h-screen flex-col bg-background font-serif font-thin antialiased`}
      >
        <DisableRightClick />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ConfirmationProvider>
              <ConditionalLayout initialSiteContent={siteContent}>{children}</ConditionalLayout>
              <Toaster />
              <SonnerToaster duration={2200} />
              <CustomerAuthModal />
              <CustomerSocialAuthListener />
            </ConfirmationProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
