import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { fetchBranding } from '@/lib/server-utils'
import ShopClient from './shop-client'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const brandName = isVi
    ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
    : (branding?.brandNameEn ?? 'ƯƠM. Archive')

  const title = isVi ? 'Tất cả sản phẩm' : 'Shop'
  const description = isVi
    ? 'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.'
    : 'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.'
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
      canonical: `/${locale}/shop`,
      languages: { vi: '/vi/shop', en: '/en/shop' },
    },
  }
}

export default function ShopPage() {
  return <ShopClient />
}
