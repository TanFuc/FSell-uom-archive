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
  weight: ['300', '400', '500', '600'],
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

async function fetchBranding(locale: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const res = await fetch(`${apiUrl}/settings/branding`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const branding = await fetchBranding(locale)

  const defaultTitle =
    locale === 'vi'
      ? (branding?.siteTitleVi ?? 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam')
      : (branding?.siteTitleEn ?? 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam')

  const brandName =
    locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
      : (branding?.brandNameEn ?? 'ƯƠM. Archive')

  const description =
    locale === 'vi'
      ? (branding?.siteDescriptionVi ?? 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.')
      : (branding?.siteDescriptionEn ?? 'Discover timeless Vietnamese ceramics curated with care.')

  const logoUrl = branding?.logoUrl || '/assets/logo.png'

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: {
      default: defaultTitle,
      template: `%s | ${brandName}`,
    },
    description,
    keywords: [
      'gốm sứ', 'ceramics', 'đồ gốm thủ công', 'Vietnamese ceramics',
      'handcrafted ceramics', 'ƯƠM. Archive', 'gốm Việt Nam', 'ceramic art',
    ],
    authors: [{ name: brandName }],
    creator: brandName,
    publisher: brandName,
    openGraph: {
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      url: 'https://uomarchive.com',
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
      icon: [{ url: '/favicon.ico' }, { url: logoUrl, sizes: 'any' }],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.json',
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
