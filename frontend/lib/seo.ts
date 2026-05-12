import { type Metadata } from 'next'

const DEFAULT_CANONICAL_BASE_URL = 'https://www.uomarchive.com'
const DEFAULT_BRAND_NAME = 'ƯƠM. Archive'
const DEFAULT_LOGO_PATH = '/assets/logo.png'
const DEFAULT_SITE_DESCRIPTION_VI =
  'Gốm sứ thủ công Việt Nam được tuyển chọn kỹ lưỡng từ nghệ nhân và câu chuyện bản địa.'
const DEFAULT_SITE_DESCRIPTION_EN =
  'Discover timeless Vietnamese handcrafted ceramics curated with care.'

export type SeoLocale = 'vi' | 'en'

export type SeoBranding = {
  brandNameVi?: string | null
  brandNameEn?: string | null
  siteTitleVi?: string | null
  siteTitleEn?: string | null
  siteDescriptionVi?: string | null
  siteDescriptionEn?: string | null
  logoUrl?: string | null
}

export type SeoPreview = {
  title: string
  description: string
  url: string
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function getCanonicalBaseUrl(rawUrl?: string): string {
  const raw =
    rawUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_CANONICAL_BASE_URL

  try {
    const url = new URL(raw)

    // Keep local development URLs untouched.
    if (!isLocalHost(url.hostname)) {
      url.protocol = 'https:'
      if (url.hostname === 'uomarchive.com') {
        url.hostname = 'www.uomarchive.com'
      }
    }

    url.hash = ''
    url.search = ''

    const canonical = url.toString().replace(/\/$/, '')
    return canonical || DEFAULT_CANONICAL_BASE_URL
  } catch {
    return DEFAULT_CANONICAL_BASE_URL
  }
}

export function getCanonicalHost(rawUrl?: string): string {
  try {
    return new URL(getCanonicalBaseUrl(rawUrl)).host
  } catch {
    return 'www.uomarchive.com'
  }
}

export function getSeoBrandName(locale: string, branding?: SeoBranding | null): string {
  const preferred = locale === 'vi' ? branding?.brandNameVi : branding?.brandNameEn
  return normalizeSeoText(preferred) || DEFAULT_BRAND_NAME
}

export function getSeoSiteTitle(locale: string, branding?: SeoBranding | null): string {
  const preferred = locale === 'vi' ? branding?.siteTitleVi : branding?.siteTitleEn
  return (
    normalizeSeoText(preferred) ||
    (locale === 'vi'
      ? 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam'
      : 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam')
  )
}

export function getSeoSiteDescription(locale: string, branding?: SeoBranding | null): string {
  const preferred = locale === 'vi' ? branding?.siteDescriptionVi : branding?.siteDescriptionEn
  return truncateMetaDescription(
    normalizeSeoText(preferred) ||
      (locale === 'vi' ? DEFAULT_SITE_DESCRIPTION_VI : DEFAULT_SITE_DESCRIPTION_EN),
  )
}

export function normalizeSeoText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[\[VARIANT_GROUPS\]\][^\n\r]*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateMetaDescription(value: string, maxLength = 155): string {
  const clean = normalizeSeoText(value)
  if (clean.length <= maxLength) return clean

  const truncated = clean.slice(0, maxLength + 1)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}...`
}

export function buildCanonicalPath(locale: SeoLocale, path = ''): string {
  const normalizedPath = path && path !== '/' ? `/${path.replace(/^\/+/, '')}` : ''
  return `/${locale}${normalizedPath}`
}

export function buildAbsoluteUrl(path: string, baseUrl = getCanonicalBaseUrl()): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildLocaleAlternates(
  path = '',
  options?: { viPath?: string; enPath?: string; xDefaultPath?: string },
): Record<string, string> {
  const viPath = options?.viPath ?? buildCanonicalPath('vi', path)
  const enPath = options?.enPath ?? buildCanonicalPath('en', path)
  return {
    vi: viPath,
    en: enPath,
    'x-default': options?.xDefaultPath ?? viPath,
  }
}

export function getSeoImageUrl(branding?: SeoBranding | null, imageUrl?: string | null): string {
  return imageUrl || branding?.logoUrl || DEFAULT_LOGO_PATH
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  branding,
  image,
  type = 'website',
  alternates,
  robots,
}: {
  locale: SeoLocale
  path: string
  title: string
  description: string
  branding?: SeoBranding | null
  image?: string | null
  type?: 'website' | 'article'
  alternates?: Record<string, string>
  robots?: Metadata['robots']
}): Metadata {
  const baseUrl = getCanonicalBaseUrl()
  const brandName = getSeoBrandName(locale, branding)
  const cleanTitle = normalizeSeoText(title) || getSeoSiteTitle(locale, branding)
  const cleanDescription = truncateMetaDescription(
    description || getSeoSiteDescription(locale, branding),
  )
  const canonicalPath = path.startsWith('/') ? path : `/${path}`
  const imageUrl = buildAbsoluteUrl(getSeoImageUrl(branding, image), baseUrl)
  const fullTitle = cleanTitle.includes(brandName) ? cleanTitle : `${cleanTitle} | ${brandName}`

  return {
    title: cleanTitle,
    description: cleanDescription,
    robots: robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalPath,
      languages: alternates ?? buildLocaleAlternates(canonicalPath.replace(/^\/(vi|en)/, '')),
    },
    openGraph: {
      title: fullTitle,
      description: cleanDescription,
      url: `${baseUrl}${canonicalPath}`,
      type,
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      siteName: brandName,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: cleanDescription,
      images: [imageUrl],
    },
  }
}

export function buildSeoPreview({
  locale,
  path,
  title,
  description,
  branding,
}: {
  locale: SeoLocale
  path: string
  title: string
  description: string
  branding?: SeoBranding | null
}): SeoPreview {
  const brandName = getSeoBrandName(locale, branding)
  const cleanTitle = normalizeSeoText(title) || getSeoSiteTitle(locale, branding)
  return {
    title: cleanTitle.includes(brandName) ? cleanTitle : `${cleanTitle} | ${brandName}`,
    description: truncateMetaDescription(description || getSeoSiteDescription(locale, branding)),
    url: buildAbsoluteUrl(path),
  }
}
