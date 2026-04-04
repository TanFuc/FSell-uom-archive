'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useSiteContent } from '@/hooks/use-settings'
import { parseStories, STORIES_CONTENT_KEY } from '@/lib/stories'

export default function JournalPage() {
  const locale = useLocale() as 'vi' | 'en'
  const { data: siteContent, isLoading } = useSiteContent()

  const stories = parseStories(siteContent?.[STORIES_CONTENT_KEY])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#efe6d8_0%,#f7f4ef_35%,#f8f6f2_100%)] pt-20">
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-foreground/50">JOURNAL</p>
          <h1 className="font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {locale === 'vi' ? 'Những Câu Chuyện ƯƠM.' : 'Stories from UOM.'}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-foreground/70 md:text-base">
            {locale === 'vi'
              ? 'Nơi chúng tôi chia sẻ các câu chuyện thủ công, hành trình sáng tạo và những khoảnh khắc phía sau mỗi bộ sưu tập.'
              : 'A place where we share handcrafted stories, creative journeys, and behind-the-scenes moments from each collection.'}
          </p>
          <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-12">
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-4 rounded-2xl border border-black/10 bg-white/70 p-3 backdrop-blur-sm">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-black/10" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-black/10" />
                <div className="h-4 w-full animate-pulse rounded bg-black/10" />
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/85 p-12 text-center text-sm text-foreground/60 shadow-sm backdrop-blur-sm">
            {locale === 'vi'
              ? 'Nội dung stories đang được cập nhật. Quay lại sau nhé.'
              : 'Stories are being updated. Please check back soon.'}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <article
                key={story.id}
                className="group overflow-hidden rounded-2xl border border-black/10 bg-white/95 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={story.imageUrl}
                    alt={locale === 'vi' ? story.titleVi : story.titleEn}
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
                    {locale === 'vi' ? story.titleVi : story.titleEn}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">
                    {locale === 'vi' ? story.summaryVi : story.summaryEn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
