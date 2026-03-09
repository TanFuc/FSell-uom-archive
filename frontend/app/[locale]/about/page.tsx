import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import AboutClient from './about-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function fetchBranding() {
  try {
    const res = await fetch(`${API_URL}/settings/branding`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const brandName = isVi ? (branding?.brandNameVi ?? 'ƯƠM. Archive') : (branding?.brandNameEn ?? 'ƯƠM. Archive')
  const title = isVi ? 'Về chúng tôi' : 'About Us'
  const description = isVi
    ? 'Câu chuyện về ƯƠM. Archive — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
    : 'The story of ƯƠM. Archive — preserving the handcrafted beauty of Vietnamese ceramics.'

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      type: 'website',
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
