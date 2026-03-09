import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import HomeClient from './home-client'

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
  const siteTitle = isVi
    ? (branding?.siteTitleVi ?? 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam')
    : (branding?.siteTitleEn ?? 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam')
  const description = isVi
    ? (branding?.siteDescriptionVi ?? 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.')
    : (branding?.siteDescriptionEn ?? 'Discover timeless Vietnamese ceramics curated with care.')

  return {
    title: { absolute: siteTitle },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { vi: '/vi', en: '/en' },
    },
  }
}

export default function HomePage() {
  return <HomeClient />
}
