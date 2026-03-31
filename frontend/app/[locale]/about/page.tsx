import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { fetchBranding } from '@/lib/server-utils'
import AboutClient from './about-client'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const brandName = isVi
    ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
    : (branding?.brandNameEn ?? 'ƯƠM. Archive')
  const title = isVi ? 'Về chúng tôi' : 'About Us'
  const description = isVi
    ? 'Câu chuyện về ƯƠM. Archive — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
    : 'The story of ƯƠM. Archive — preserving the handcrafted beauty of Vietnamese ceramics.'
  const logoUrl = branding?.logoUrl || '/assets/logo.png'

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      type: 'website',
      images: [{ url: logoUrl, width: 1200, height: 630, alt: `${brandName} Logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${brandName}`,
      description,
      images: [logoUrl],
    },
    alternates: {
      canonical: `/${locale}/about`,
      languages: { vi: '/vi/about', en: '/en/about' },
    },
  }
}

export default function AboutPage() {
  return <AboutClient />
}
