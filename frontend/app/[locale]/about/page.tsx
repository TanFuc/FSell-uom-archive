import { type Metadata } from 'next'
import Script from 'next/script'
import AboutClient from './about-client'
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
  const title = isVi ? 'Về chúng tôi' : 'About Us'
  const description = isVi
    ? 'Câu chuyện về ƯƠM. Archive — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
    : 'The story of ƯƠM. Archive — preserving the handcrafted beauty of Vietnamese ceramics.'
  const logoUrl = branding?.logoUrl || `${BASE_URL}/assets/logo.png`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${brandName}`,
      description,
      url: `${BASE_URL}/${locale}/about`,
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

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const branding = await fetchBranding()
  const brandName =
    locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM. Archive')
      : (branding?.brandNameEn ?? 'ƯƠM. Archive')
  const description =
    locale === 'vi'
      ? 'Câu chuyện về ƯƠM. Archive — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
      : 'The story of ƯƠM. Archive — preserving the handcrafted beauty of Vietnamese ceramics.'

  return (
    <>
      <Script
        id="about-page-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `${brandName} - About`,
            url: `${BASE_URL}/${locale}/about`,
            description,
          }),
        }}
      />
      <Script
        id="about-breadcrumb-jsonld"
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
                name: locale === 'vi' ? 'Về chúng tôi' : 'About Us',
                item: `${BASE_URL}/${locale}/about`,
              },
            ],
          }),
        }}
      />
      <AboutClient />
    </>
  )
}
