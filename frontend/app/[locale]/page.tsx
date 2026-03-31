import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { fetchBranding } from '@/lib/server-utils'
import HomeClient from './home-client'

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

export default async function HomePage() {
  const branding = await fetchBranding()
  const logo = branding?.logoUrl || 'https://uomarchive.com/assets/logo.png'
  const name = branding?.brandNameVi || 'ƯƠM. Archive'
  const description =
    branding?.siteDescriptionVi || 'Gốm sứ thủ công Việt Nam — Vietnamese Handcrafted Ceramics'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: name,
            url: 'https://uomarchive.com',
            logo: logo,
            sameAs: [],
            description: description,
          }),
        }}
      />
      <HomeClient />
    </>
  )
}
