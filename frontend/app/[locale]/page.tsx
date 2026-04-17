import { type Metadata } from 'next'
import Script from 'next/script'
import HomeClient from './home-client'
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
  const siteTitle = isVi
    ? (branding?.siteTitleVi ?? 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam')
    : (branding?.siteTitleEn ?? 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam')
  const description = isVi
    ? (branding?.siteDescriptionVi ?? 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.')
    : (branding?.siteDescriptionEn ?? 'Discover timeless Vietnamese ceramics curated with care.')
  const logo = branding?.logoUrl || `${BASE_URL}/assets/logo.png`

  return {
    title: { absolute: siteTitle },
    description,
    openGraph: {
      title: siteTitle,
      description,
      url: `${BASE_URL}/${locale}`,
      type: 'website',
      images: [{ url: logo, width: 1200, height: 630, alt: siteTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      images: [logo],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { vi: '/vi', en: '/en', 'x-default': '/vi' },
    },
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const branding = await fetchBranding()
  const logo = branding?.logoUrl || `${BASE_URL}/assets/logo.png`
  const name = branding?.brandNameVi || 'ƯƠM. Archive'
  const description =
    branding?.siteDescriptionVi || 'Gốm sứ thủ công Việt Nam — Vietnamese Handcrafted Ceramics'

  return (
    <>
      <Script
        id="home-org-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: name,
            url: 'https://www.uomarchive.com',
            logo: logo,
            sameAs: [],
            description: description,
          }),
        }}
      />
      <Script
        id="home-website-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name,
            url: `${BASE_URL}/${locale}`,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${BASE_URL}/${locale}/shop?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <HomeClient />
    </>
  )
}
