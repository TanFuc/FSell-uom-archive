import type { Metadata, Viewport } from 'next'
import { Lora, Montserrat, Playfair_Display } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { Toaster as SonnerToaster } from 'sonner'
import { DisableRightClick } from '@/components/DisableRightClick'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { locales } from '@/i18n'
import { getCanonicalBaseUrl } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import '@/styles/globals.css'
import '@/styles/loading-animations.css'

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const viewport: Viewport = {
  themeColor: '#000000',
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

  const defaultTitle =
    locale === 'vi'
      ? (branding?.siteTitleVi ?? 'ƯƠM. - Gốm sứ thủ công Việt Nam')
      : (branding?.siteTitleEn ?? 'ƯƠM. - Handcrafted Ceramics from Vietnam')

  const brandName =
    locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM.')
      : (branding?.brandNameEn ?? 'ƯƠM.')

  const description =
    locale === 'vi'
      ? (branding?.siteDescriptionVi ?? 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.')
      : (branding?.siteDescriptionEn ?? 'Discover timeless Vietnamese ceramics curated with care.')

  const logoUrl = branding?.logoUrl || '/assets/logo.png'
  const tabIconUrl = '/assets/logo.png'

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
      images: [{ url: logoUrl, width: 1200, height: 630, alt: `${brandName} Logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandName,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: [
        { url: tabIconUrl, type: 'image/png' },
        { url: '/assets/logo.svg', type: 'image/svg+xml' },
      ],
      shortcut: [{ url: tabIconUrl, type: 'image/png' }],
      apple: [{ url: tabIconUrl, sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        vi: `${baseUrl}/vi`,
        en: `${baseUrl}/en`,
        'x-default': `${baseUrl}/vi`,
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
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${lora.variable} ${montserrat.variable} ${playfair.variable} flex min-h-screen flex-col bg-background font-serif antialiased`}
      >
        <DisableRightClick />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
            <SonnerToaster />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
