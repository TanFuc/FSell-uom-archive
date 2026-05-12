import { type Metadata } from 'next'
import Script from 'next/script'
import { buildPageMetadata, getCanonicalBaseUrl, getSeoBrandName } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import AboutClient from './about-client'

const BASE_URL = getCanonicalBaseUrl()

function getAboutSeo(locale: string) {
  return locale === 'vi'
    ? {
        title: 'Về chúng tôi',
        description: 'Câu chuyện về ƯƠM. Archive, nơi lưu giữ vẻ đẹp thủ công của gốm sứ Việt Nam.',
      }
    : {
        title: 'About Us',
        description:
          'The story of ƯƠM. Archive, preserving the handcrafted beauty of Vietnamese ceramics.',
      }
}

function getAboutFaq(locale: string) {
  return locale === 'vi'
    ? [
        {
          question: 'ƯƠM. Archive là gì?',
          answer:
            'ƯƠM. Archive là không gian tuyển chọn gốm sứ thủ công Việt Nam, kết nối câu chuyện, nghệ nhân và khách hàng yêu giá trị thủ công.',
        },
        {
          question: 'Tôi có thể xem bộ sưu tập ở đâu?',
          answer:
            'Bạn có thể xem đầy đủ bộ sưu tập tại trang Shop và lọc theo từng danh mục gốm sứ.',
        },
        {
          question: 'Làm sao để đặt hàng hoặc tư vấn?',
          answer:
            'Bạn có thể nhắn qua Instagram/Facebook hoặc gửi yêu cầu tại trang sản phẩm để được tư vấn chi tiết.',
        },
        {
          question: 'Tôi nên bắt đầu từ đâu?',
          answer:
            'Hãy bắt đầu từ trang Journal để hiểu triết lý, sau đó khám phá các sản phẩm phù hợp với bạn.',
        },
      ]
    : [
        {
          question: 'What is ƯƠM. Archive?',
          answer:
            'ƯƠM. Archive curates Vietnamese handcrafted ceramics, connecting artisan stories with customers who value craftsmanship.',
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
          answer:
            'Start with the Journal to understand our philosophy, then explore products that fit your style.',
        },
      ]
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const seo = getAboutSeo(locale)

  return buildPageMetadata({
    locale,
    path: `/${locale}/about`,
    title: seo.title,
    description: seo.description,
    branding,
    alternates: { vi: '/vi/about', en: '/en/about', 'x-default': '/vi/about' },
  })
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const brandName = getSeoBrandName(locale, branding)
  const seo = getAboutSeo(locale)
  const faqItems = getAboutFaq(locale)

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
            name: `${brandName} - ${seo.title}`,
            url: `${BASE_URL}/${locale}/about`,
            description: seo.description,
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
                name: seo.title,
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
