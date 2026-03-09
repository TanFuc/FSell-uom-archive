import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import ShopClient from './shop-client'

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

  const title = isVi ? 'Tất cả sản phẩm' : 'Shop'
  const description = isVi
    ? 'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.'
    : 'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.'

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      type: 'website',
    },
    alternates: {
      canonical: `/${locale}/shop`,
      languages: { vi: '/vi/shop', en: '/en/shop' },
    },
  }
}

export default function ShopPage() {
  return <ShopClient />
}