import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, getCanonicalBaseUrl } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY } from '@/lib/stories'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'
const BASE_URL = getCanonicalBaseUrl()
export const revalidate = 3600

type SiteContentResponse = Record<string, unknown>

async function fetchSiteContent(): Promise<SiteContentResponse | null> {
  try {
    const response = await fetch(`${API_URL}/settings/site-content`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) return null

    const payload = (await response.json()) as unknown
    if (!payload || typeof payload !== 'object') return null

    const root = payload as { data?: unknown }
    if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
      return root.data as SiteContentResponse
    }

    return payload as SiteContentResponse
  } catch {
    return null
  }
}

interface PageProps {
  params: { locale: string }
}

function getJournalSeo(locale: string) {
  return locale === 'vi'
    ? {
        title: 'Journal | Những câu chuyện ƯƠM.',
        description:
          'Khám phá hành trình sáng tạo, thủ công và những câu chuyện phía sau từng bộ sưu tập của ƯƠM. Archive.',
      }
    : {
        title: 'Journal | Stories from ƯƠM.',
        description:
          'Explore handcrafted journeys, creative process, and stories behind each ƯƠM. Archive collection.',
      }
}

function getJournalFaq(locale: string) {
  return locale === 'vi'
    ? [
        {
          question: 'Journal ƯƠM. nói về điều gì?',
          answer:
            'Journal chia sẻ câu chuyện thủ công, hành trình sáng tạo và những chất liệu làm nên từng bộ sưu tập.',
        },
        {
          question: 'Tôi có thể tìm sản phẩm được nhắc tới ở đâu?',
          answer: 'Hãy truy cập trang Shop để xem các bộ sưu tập và sản phẩm liên quan.',
        },
        {
          question: 'Bao lâu có bài viết mới?',
          answer: 'Chúng tôi cập nhật nội dung theo mùa và theo các dự án hợp tác với nghệ nhân.',
        },
      ]
    : [
        {
          question: 'What is the ƯƠM. Journal about?',
          answer:
            'The Journal shares artisan stories, creative journeys, and the materials behind each collection.',
        },
        {
          question: 'Where can I find the products mentioned?',
          answer: 'Visit the Shop page to explore related collections and products.',
        },
        {
          question: 'How often do you publish new stories?',
          answer: 'We publish new stories seasonally and whenever we collaborate with artisans.',
        },
      ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const branding = await fetchBranding()
  const seo = getJournalSeo(locale)

  return buildPageMetadata({
    locale,
    path: `/${locale}/journal`,
    title: seo.title,
    description: seo.description,
    branding,
    alternates: { vi: '/vi/journal', en: '/en/journal', 'x-default': '/vi/journal' },
  })
}

export default async function JournalPage({ params }: PageProps) {
  const locale = params.locale === 'vi' ? 'vi' : 'en'
  const t = await getTranslations({ locale, namespace: 'journal' })
  const tNav = await getTranslations({ locale, namespace: 'Navigation' })
  const siteContent = await fetchSiteContent()
  const stories = parseStories(siteContent?.[STORIES_CONTENT_KEY]).filter(
    (story) => story.isVisible !== false,
  )
  const storyCta = locale === 'vi' ? 'Đọc story' : 'Read story'
  const faqItems = getJournalFaq(locale)

  return (
    <div className="safe-screen min-h-screen bg-[radial-gradient(circle_at_top,#efe6d8_0%,#f7f4ef_35%,#f8f6f2_100%)] pt-20">
      <Script
        id="journal-faq-jsonld"
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
      <Script
        id="journal-collection-jsonld"
        strategy="beforeInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: getJournalSeo(locale).title,
            url: `${BASE_URL}/${locale}/journal`,
            description: getJournalSeo(locale).description,
          }),
        }}
      />
      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-mobile-safe mb-3 text-[10px] uppercase tracking-[0.24em] text-foreground/50 sm:tracking-[0.35em]">
            {tNav('journal')}
          </p>
          <h1 className="text-mobile-safe font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
            {t('heroDescription')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/55 sm:tracking-[0.28em]">
            <Link
              href={`/${locale}/shop`}
              className="rounded-full border border-foreground/15 px-4 py-2 transition-all hover:border-foreground/40 hover:text-foreground"
            >
              {tNav('shop')}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="rounded-full border border-foreground/15 px-4 py-2 transition-all hover:border-foreground/40 hover:text-foreground"
            >
              {tNav('about')}
            </Link>
          </div>
          <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        </div>
      </section>

      <section id="stories" className="scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-12">
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/85 p-12 text-center text-sm text-foreground/60 shadow-sm backdrop-blur-sm">
            {t('empty')}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story, index) => (
              <Link
                key={story.id}
                href={`/${locale}/journal/${encodeURIComponent(getStorySlug(story, locale))}`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/[0.03]">
                  <Image
                    src={story.imageUrl}
                    alt={locale === 'vi' ? story.titleVi : story.titleEn}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                    priority={index < 3}
                    unoptimized
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-70" />
                </div>
                <div className="space-y-3 p-5">
                  {story.publishedAt && (
                    <p className="inline-flex max-w-full rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-foreground/55 sm:tracking-[0.18em]">
                      {story.publishedAt}
                    </p>
                  )}
                  <h2 className="text-mobile-safe font-playfair text-xl leading-tight text-foreground">
                    {locale === 'vi' ? story.titleVi : story.titleEn}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">
                    {locale === 'vi' ? story.summaryVi : story.summaryEn}
                  </p>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground/55 sm:tracking-[0.28em]">
                    {storyCta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-2xl border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.question}>
                <h3 className="text-mobile-safe text-sm font-semibold uppercase tracking-[0.1em] text-foreground sm:tracking-[0.15em]">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
