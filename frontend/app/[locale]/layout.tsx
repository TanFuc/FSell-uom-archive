import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import '@/styles/globals.css'
import '@/styles/loading-animations.css'

export const metadata: Metadata = {
  title: {
    default: 'Ươm Archive - Curated Vietnamese Fashion',
    template: '%s | Ươm Archive',
  },
  description: 'Discover timeless Vietnamese fashion pieces curated with care.',
  keywords: ['fashion', 'vietnamese', 'archive', 'minimalist', 'clothing', 'ươm'],
  authors: [{ name: 'Ươm Archive' }],
  creator: 'Ươm Archive',
  publisher: 'Ươm Archive',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://uomarchive.com',
    title: 'Ươm Archive - Curated Vietnamese Fashion',
    description: 'Discover timeless Vietnamese fashion pieces curated with care.',
    siteName: 'Ươm Archive',
    images: [
      {
        url: '/assets/logo.png',
        width: 1200,
        height: 630,
        alt: 'Ươm Archive Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ươm Archive',
    description: 'Discover timeless Vietnamese fashion pieces curated with care.',
    images: ['/assets/logo.png'],
    creator: '@uomarchive',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#4A4238',
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  if (!locales.includes(locale as typeof locales[number])) {
    notFound()
  }

  unstable_setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background font-serif antialiased">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <Header />
            <main className="flex-1 pt-16 md:pt-20">
              {children}
            </main>
            <Footer />
            <Toaster />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
