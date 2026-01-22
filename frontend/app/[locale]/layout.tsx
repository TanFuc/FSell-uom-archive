import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from '@/components/ui/toaster'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { DisableRightClick } from '@/components/DisableRightClick'
import { Lora, Montserrat, Playfair_Display } from 'next/font/google'
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

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
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
      { url: '/assets/logo-remove.png', sizes: 'any' },
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
      <body className={`${lora.variable} ${montserrat.variable} ${playfair.variable} min-h-screen flex flex-col bg-background font-serif antialiased`}>
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
