import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchSiteContentServer } from '@/lib/server-utils'
import { BUILTIN_PAGE_SLUGS, parseSitePages } from '@/lib/site-structure'

type Props = { params: { locale: string; slug: string } }

async function getPage(slug: string) {
  const content = await fetchSiteContentServer()
  return parseSitePages(content).find(
    (page) =>
      page.slug === slug &&
      page.isVisible &&
      !BUILTIN_PAGE_SLUGS.includes(slug as (typeof BUILTIN_PAGE_SLUGS)[number]),
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage(params.slug)
  if (!page) return { robots: { index: false } }
  const isVi = params.locale !== 'en'
  return {
    title: isVi ? page.titleVi : page.titleEn,
    description: isVi ? page.descriptionVi : page.descriptionEn,
  }
}

export default async function CustomPage({ params }: Props) {
  const page = await getPage(params.slug)
  if (!page) notFound()
  const isVi = params.locale !== 'en'
  return (
    <main className="safe-screen min-h-screen bg-white px-4 pb-24 pt-36 text-[#4A4238] sm:px-6 lg:px-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-playfair text-3xl sm:text-5xl font-light">{isVi ? page.titleVi : page.titleEn}</h1>
        <p className="mt-6 text-sm font-thin leading-7 text-[#8C7E6A]">
          {isVi ? page.descriptionVi : page.descriptionEn}
        </p>
        <div className="mt-12 whitespace-pre-wrap text-sm font-thin leading-8 sm:text-base">
          {isVi ? page.contentVi : page.contentEn}
        </div>
      </article>
    </main>
  )
}
