import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import { JournalRichContent } from '@/components/journal/JournalRichContent'
import { getCanonicalBaseUrl } from '@/lib/seo'
import { fetchBranding } from '@/lib/server-utils'
import {
  getStoryBySlug,
  getStorySlug,
  parseStories,
  STORIES_CONTENT_KEY,
  stripHtmlTags,
  toStorySlug,
} from '@/lib/stories'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'
const BASE_URL = getCanonicalBaseUrl()

type SiteContentResponse = Record<string, unknown>

type FetchSiteContentResult =
  | { status: 'ok'; data: SiteContentResponse }
  | { status: 'not-found' }
  | { status: 'error' }

async function fetchSiteContent(): Promise<FetchSiteContentResult> {
  try {
    const response = await fetch(`${API_URL}/settings/site-content`, {
      next: { revalidate: 300 },
    })

    if (response.status === 404) {
      return { status: 'not-found' }
    }

    if (!response.ok) {
      return { status: 'error' }
    }

    const payload = (await response.json()) as unknown
    if (!payload || typeof payload !== 'object') {
      return { status: 'error' }
    }

    const root = payload as { data?: unknown }
    if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
      return { status: 'ok', data: root.data as SiteContentResponse }
    }

    return { status: 'ok', data: payload as SiteContentResponse }
  } catch {
    return { status: 'error' }
  }
}

interface StoryDetailProps {
  params: { locale: 'vi' | 'en'; slug: string }
}

export async function generateMetadata({ params }: StoryDetailProps): Promise<Metadata> {
  const [siteContent, branding] = await Promise.all([fetchSiteContent(), fetchBranding()])
  const brandName =
    params.locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM.')
      : (branding?.brandNameEn ?? 'ƯƠM.')

  if (siteContent.status === 'error') {
    return {
      title: params.locale === 'vi' ? 'Bai viet' : 'Story',
      description:
        params.locale === 'vi'
          ? `Doc cac cau chuyen thu cong tu ${brandName}.`
          : `Read handcrafted stories from ${brandName}.`,
      robots: { index: true, follow: true },
      alternates: {
        canonical: `/${params.locale}/journal/${params.slug}`,
        languages: {
          vi: `/vi/journal/${params.slug}`,
          en: `/en/journal/${params.slug}`,
          'x-default': `/vi/journal/${params.slug}`,
        },
      },
    }
  }

  const stories = parseStories(
    siteContent.status === 'ok' ? siteContent.data[STORIES_CONTENT_KEY] : undefined,
  ).filter((item) => item.isVisible !== false)
  const story = getStoryBySlug(stories, params.slug, params.locale)

  if (!story) {
    return {
      title: 'Story Not Found',
      robots: { index: false, follow: false },
    }
  }

  const title = params.locale === 'vi' ? story.titleVi : story.titleEn
  const description = stripHtmlTags(
    params.locale === 'vi' ? story.summaryVi : story.summaryEn,
  ).slice(0, 170)
  const viSlug = encodeURIComponent(getStorySlug(story, 'vi'))
  const enSlug = encodeURIComponent(getStorySlug(story, 'en'))
  const canonicalPath = params.locale === 'vi' ? `/vi/journal/${viSlug}` : `/en/journal/${enSlug}`
  const storyImage = story.imageUrl

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        vi: `/vi/journal/${viSlug}`,
        en: `/en/journal/${enSlug}`,
        'x-default': `/vi/journal/${viSlug}`,
      },
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${BASE_URL}${canonicalPath}`,
      images: storyImage
        ? [{ url: storyImage, width: 1200, height: 800, alt: title }]
        : undefined,
      publishedTime: story.publishedAt
        ? new Date(story.publishedAt).toISOString()
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: storyImage ? [storyImage] : undefined,
    },
  }
}

export default async function StoryDetailPage({ params }: StoryDetailProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'journal' })
  const [siteContent, branding] = await Promise.all([fetchSiteContent(), fetchBranding()])
  const brandName =
    params.locale === 'vi'
      ? (branding?.brandNameVi ?? 'ƯƠM.')
      : (branding?.brandNameEn ?? 'ƯƠM.')
  const stories = parseStories(
    siteContent.status === 'ok' ? siteContent.data[STORIES_CONTENT_KEY] : undefined,
  ).filter((item) => item.isVisible !== false)
  const story = getStoryBySlug(stories, params.slug, params.locale)

  if (!story) {
    notFound()
  }

  if (params.locale === 'en') {
    const currentSlug = toStorySlug(params.slug)
    const canonicalEnSlug = getStorySlug(story, 'en')

    if (currentSlug !== canonicalEnSlug) {
      permanentRedirect(`/en/journal/${encodeURIComponent(canonicalEnSlug)}`)
    }
  }

  const title = params.locale === 'vi' ? story.titleVi : story.titleEn
  const summary = params.locale === 'vi' ? story.summaryVi : story.summaryEn
  const content = params.locale === 'vi' ? story.contentVi : story.contentEn
  const relatedStories = stories.filter((item) => item.id !== story.id).slice(0, 4)
  const shopCta = params.locale === 'vi' ? 'Xem shop' : 'Visit the shop'

  const viSlug = encodeURIComponent(getStorySlug(story, 'vi'))
  const enSlug = encodeURIComponent(getStorySlug(story, 'en'))
  const canonicalPath = params.locale === 'vi' ? `/vi/journal/${viSlug}` : `/en/journal/${enSlug}`

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: summary,
    image: [story.imageUrl],
    datePublished: story.publishedAt
      ? new Date(story.publishedAt).toISOString()
      : new Date().toISOString(),
    author: [
      {
        '@type': 'Organization',
        name: brandName,
        url: BASE_URL,
      },
    ],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/${params.locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Journal',
        item: `${BASE_URL}/${params.locale}/journal`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${BASE_URL}${canonicalPath}`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe5d6_0%,#f7f4ef_40%,#f9f7f3_100%)] pt-20">
      <Script
        id="article-jsonld"
        strategy="afterInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        strategy="afterInteractive"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-10">
        <Link
          href={`/${params.locale}/journal#stories`}
          className="mb-6 inline-flex text-[11px] uppercase tracking-[0.2em] text-foreground/55 transition hover:text-foreground"
        >
          {t('backToJournal')}
        </Link>

        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-10">
          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/45">
              JOURNAL STORY
            </p>
            <h1 className="font-playfair text-3xl leading-tight text-foreground md:text-5xl">
              {title}
            </h1>
            {story.publishedAt && (
              <p className="inline-flex rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                {story.publishedAt}
              </p>
            )}
            <p className="max-w-3xl text-sm leading-relaxed text-foreground/75 md:text-base">
              {summary}
            </p>
          </div>
        </div>

        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-lg">
          <Image
            src={story.imageUrl}
            alt={`${title} - Câu chuyện từ ƯƠM. Archive - Handcrafted Journal`}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <JournalRichContent
          content={content}
          fallbackAlt={`${title} - ƯƠM. Archive Journal`}
          className="prose prose-neutral prose-headings:font-playfair prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 mt-10 max-w-none rounded-3xl border border-black/10 bg-white/85 p-6 leading-relaxed shadow-sm backdrop-blur-sm md:p-10"
        />

        <div className="mt-10 flex justify-center">
          <Link
            href={`/${params.locale}/shop`}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground underline decoration-foreground/15 underline-offset-8 transition hover:opacity-70"
          >
            {shopCta}
          </Link>
        </div>

        {relatedStories.length > 0 && (
          <section className="mt-16 border-t border-black/10 pt-12">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/45">
                  JOURNAL
                </p>
                <h2 className="mt-2 font-playfair text-2xl text-foreground">
                  {t('relatedStories')}
                </h2>
              </div>
              <Link
                href={`/${params.locale}/journal#stories`}
                className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 transition hover:text-foreground"
              >
                {t('viewAllStories')}
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {relatedStories.map((item) => {
                const href = `/${params.locale}/journal/${encodeURIComponent(
                  getStorySlug(item, params.locale),
                )}`
                const itemTitle = params.locale === 'vi' ? item.titleVi : item.titleEn
                const itemSummary = params.locale === 'vi' ? item.summaryVi : item.summaryEn

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={itemTitle}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="font-playfair text-xl leading-tight text-foreground">
                        {itemTitle}
                      </h3>
                      <p className="line-clamp-3 text-sm text-foreground/70">{itemSummary}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
