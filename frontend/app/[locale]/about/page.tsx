import { type Metadata } from 'next'
import Script from 'next/script'
import { getCanonicalBaseUrl } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import AboutClient from './about-client'

const BASE_URL = getCanonicalBaseUrl()

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale
  const branding = await fetchBranding()

  const isVi = locale === 'vi'
  const brandName = isVi
    ? (branding?.brandNameVi ?? 'ƯƠM.')
    : (branding?.brandNameEn ?? 'ƯƠM.')
  const title = isVi ? 'Về chúng tôi' : 'About Us'
  const description = isVi
    ? 'Câu chuyện về ƯƠM. — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
    : 'The story of ƯƠM. — preserving the handcrafted beauty of Vietnamese ceramics.'
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
      languages: { vi: '/vi/about', en: '/en/about', 'x-default': '/vi/about' },
    },
  }
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const branding = await fetchBranding()
  const brandName =
    locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM.')
      : (branding?.brandNameEn ?? 'ƯƠM.')
  const description =
    locale === 'vi'
      ? 'Câu chuyện về ƯƠM. — nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.'
      : 'The story of ƯƠM. — preserving the handcrafted beauty of Vietnamese ceramics.'
  const faqItems =
    locale === 'vi'
      ? [
          {
            question: 'ƯƠM. là gì?',
            answer:
              'ƯƠM. là không gian tuyển chọn gốm sứ thủ công Việt Nam, kết nối câu chuyện, nghệ nhân và khách hàng yêu giá trị thủ công.',
          },
          {
            question: 'Tôi có thể xem bộ sưu tập ở đâu?',
            answer: 'Bạn có thể xem đầy đủ bộ sưu tập tại trang Shop và lọc theo từng danh mục gốm sứ.',
          },
          {
            question: 'Làm sao để đặt hàng hoặc tư vấn?',
            answer:
              'Bạn có thể nhắn qua Instagram/Facebook hoặc gửi yêu cầu tại trang sản phẩm để được tư vấn chi tiết.',
          },
          {
            question: 'Tôi nên bắt đầu từ đâu?',
            answer: 'Hãy bắt đầu từ trang Journal để hiểu triết lý, sau đó khám phá các sản phẩm phù hợp với bạn.',
          },
        ]
      : [
          {
            question: 'What is ƯƠM.?',
            answer:
              'ƯƠM. curates Vietnamese handcrafted ceramics, connecting artisan stories with customers who value craftsmanship.',
          },
          {
            question: 'Where can I view the collection?',
            answer: 'Browse the full collection on the Shop page and filter by ceramic categories.',
          },
          {
            question: 'How can I inquire or place an order?',
            answer:
              'Message us via Instagram/Facebook or use the product inquiry section for detailed support.',
          },
          {
            question: 'Where should I start?',
            answer: 'Start with the Journal to understand our philosophy, then explore products that fit your style.',
          },
        ]

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
      <Script
        id="about-faq-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
      <AboutClient />
    </>
  )
}
