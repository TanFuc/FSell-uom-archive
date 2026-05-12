import { type Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import { buildPageMetadata, getCanonicalBaseUrl, getSeoBrandName } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import ShopClient from './shop-client'

const BASE_URL = getCanonicalBaseUrl()
export const revalidate = 3600

function getShopSeo(locale: string) {
  return locale === 'vi'
    ? {
        title: 'Tất cả sản phẩm',
        description:
          'Khám phá bộ sưu tập gốm sứ thủ công được tuyển chọn từ các nghệ nhân Việt Nam.',
      }
    : {
        title: 'Shop',
        description:
          'Discover our curated collection of handcrafted ceramics from Vietnamese artisans.',
      }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const seo = getShopSeo(locale)

  return buildPageMetadata({
    locale,
    path: `/${locale}/shop`,
    title: seo.title,
    description: seo.description,
    branding,
    alternates: { vi: '/vi/shop', en: '/en/shop', 'x-default': '/vi/shop' },
  })
}

export default async function ShopPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const brandName = getSeoBrandName(locale, branding)
  const seo = getShopSeo(locale)

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
            description: seo.description,
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
                name: locale === 'vi' ? 'Cửa hàng' : 'Shop',
                item: `${BASE_URL}/${locale}/shop`,
              },
            ],
          }),
        }}
      />
      <Suspense fallback={null}>
        <ShopClient />
      </Suspense>
    </>
  )
}
