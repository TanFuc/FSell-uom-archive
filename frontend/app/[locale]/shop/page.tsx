import { type Metadata } from 'next'
import Script from 'next/script'
import ShopClient from './shop-client'
import { fetchBranding } from '@/lib/server-utils'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com'

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const brandName = isVi
    ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
    : (branding?.brandNameEn ?? 'ƯƠM. Archive')

  const title = isVi ? 'Tất cả sản phẩm' : 'Shop'
  const description = isVi
    ? 'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.'
    : 'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.'
  const logoUrl = branding?.logoUrl || `${BASE_URL}/assets/logo.png`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      url: `${BASE_URL}/${locale}/shop`,
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
      languages: { vi: '/vi/shop', en: '/en/shop', 'x-default': '/vi/shop' },
    },
  }
}

export default async function ShopPage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const branding = await fetchBranding()
  const brandName =
    locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
      : (branding?.brandNameEn ?? 'ƯƠM. Archive')
  const description =
    locale === 'vi'
      ? 'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.'
      : 'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.'

  return (
    <>
      <Script
        id="shop-collection-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${brandName} Shop`,
            url: `${BASE_URL}/${locale}/shop`,
            description,
          }),
        }}
      />
      <Script
        id="shop-breadcrumb-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${BASE_URL}/${locale}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: locale === 'vi' ? 'Cua hang' : 'Shop',
                item: `${BASE_URL}/${locale}/shop`,
              },
            ],
          }),
        }}
      />
      <ShopClient />
    </>
  )
}
