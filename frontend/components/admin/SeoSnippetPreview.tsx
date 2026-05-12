'use client'

import { buildSeoPreview, type SeoBranding, type SeoLocale } from '@/lib/seo'

type SeoSnippetPreviewProps = {
  locale: SeoLocale
  path: string
  title: string
  description: string
  branding?: SeoBranding | null
}

export function SeoSnippetPreview({
  locale,
  path,
  title,
  description,
  branding,
}: SeoSnippetPreviewProps) {
  const preview = buildSeoPreview({ locale, path, title, description, branding })

  return (
    <div className="rounded-lg border bg-white p-4 font-sans normal-case tracking-normal">
      <p className="truncate text-xs text-[#202124]">{preview.url}</p>
      <p className="mt-1 line-clamp-2 text-[18px] leading-snug text-[#1a0dab]">{preview.title}</p>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#4d5156]">
        {preview.description}
      </p>
    </div>
  )
}
