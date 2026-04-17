import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getStorySlug, parseStories, STORIES_CONTENT_KEY } from '@/lib/stories'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(
  /\/$/,
  '',
)

type SiteContentResponse = Record<string, unknown>

async function fetchSiteContent(): Promise<SiteContentResponse | null> {
  try {
    const response = await fetch(`${API_URL}/settings/site-content`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as unknown
    if (!payload || typeof payload !== 'object') {
      return null
    }

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isVi = params.locale === 'vi'
  const title = isVi ? 'Journal | Những Câu Chuyện ƯƠM.' : 'Journal | Stories from UOM.'
  const description = isVi
    ? 'Khám phá hành trình sáng tạo, thủ công và những câu chuyện phía sau từng bộ sưu tập của ƯƠM.'
    : 'Explore handcrafted journeys, creative process, and stories behind each UOM collection.'

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}/journal`,
      languages: {
        vi: '/vi/journal',
        en: '/en/journal',
        'x-default': '/vi/journal',
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${BASE_URL}/${params.locale}/journal`,
    },
  }
}

export default async function JournalPage({ params }: PageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'journal' })
  const siteContent = await fetchSiteContent()
  const stories = parseStories(siteContent?.[STORIES_CONTENT_KEY]).filter(
    (story) => story.isVisible !== false,
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe6d8_0%,#f7f4ef_35%,#f8f6f2_100%)] pt-20">
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-foreground/50">JOURNAL</p>
          <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
            {t('heroDescription')}
          </p>
          <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        </div>
      </section>

      <section id="stories" className="scroll-mt-24 px-6 pb-20 lg:px-12">
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/85 p-12 text-center text-sm text-foreground/60 shadow-sm backdrop-blur-sm">
            {t('empty')}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/${params.locale}/journal/${encodeURIComponent(getStorySlug(story, params.locale as 'vi' | 'en'))}`}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={story.imageUrl}
                    alt={params.locale === 'vi' ? story.titleVi : story.titleEn}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-70" />
                </div>
                <div className="space-y-3 p-5">
                  {story.publishedAt && (
                    <p className="inline-flex rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                      {story.publishedAt}
                    </p>
                  )}
                  <h2 className="font-playfair text-xl leading-tight text-foreground">
                    {params.locale === 'vi' ? story.titleVi : story.titleEn}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">
                    {params.locale === 'vi' ? story.summaryVi : story.summaryEn}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
