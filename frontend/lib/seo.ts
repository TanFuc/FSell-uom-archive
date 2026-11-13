import { type Metadata } from 'next'

const DEFAULT_CANONICAL_BASE_URL = 'https://www.uomarchive.com'
const DEFAULT_IMAGE_BASE_URL = 'https://images.uomarchive.com'
const DEFAULT_BRAND_NAME = 'ƯƠM.'
const DEFAULT_LOGO_PATH = '/assets/logo.png'
const DEFAULT_SITE_DESCRIPTION_VI =
  'ƯƠM. tuyển chọn gốm sứ thủ công Việt Nam, lưu giữ vẻ đẹp mộc mạc, tinh tế và câu chuyện của nghệ nhân bản địa.'
const DEFAULT_SITE_DESCRIPTION_EN =
  'Discover Vietnamese handcrafted ceramics curated for quiet beauty, refined living, and artisan stories.'

const NAVIGATION_LABELS = [
  'Trang chủ',
  'Sản phẩm',
  'Về chúng tôi',
  'Tạp chí',
  'Liên hệ',
  'Home',
  'Shop',
  'Products',
  'About Us',
  'Journal',
  'Contact',
]

const NAVIGATION_LABEL_PATTERN = NAVIGATION_LABELS.map((label) =>
  label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
).join('|')
const CONCATENATED_NAVIGATION_PATTERN = new RegExp(
  `(${NAVIGATION_LABEL_PATTERN})(?=(${NAVIGATION_LABEL_PATTERN}))`,
  'g',
)

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
    rawUrl?.trim() ?? process.env.NEXT_PUBLIC_APP_URL?.trim() ?? DEFAULT_CANONICAL_BASE_URL

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
    return canonical.length > 0 ? canonical : DEFAULT_CANONICAL_BASE_URL
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
      ? 'ƯƠM. - Gốm sứ thủ công Việt Nam'
      : 'ƯƠM. - Handcrafted Ceramics from Vietnam')
  )
}

export function getSeoSiteDescription(locale: string, branding?: SeoBranding | null): string {
  const preferred = locale === 'vi' ? branding?.siteDescriptionVi : branding?.siteDescriptionEn
  const cleanPreferred = normalizeSeoText(preferred)
  const fallback = locale === 'vi' ? DEFAULT_SITE_DESCRIPTION_VI : DEFAULT_SITE_DESCRIPTION_EN

  return truncateMetaDescription(
    cleanPreferred && !looksLikeNavigationLeak(cleanPreferred) ? cleanPreferred : fallback,
  )
}

export function normalizeSeoText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[\[VARIANT_GROUPS\]\][^\n\r]*/g, ' ')
    .replace(/[\u00a0\u200b-\u200d\ufeff]/g, ' ')
    .replace(CONCATENATED_NAVIGATION_PATTERN, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeNavigationLeak(value: string): boolean {
  const matches = NAVIGATION_LABELS.filter((label) =>
    value.toLowerCase().includes(label.toLowerCase()),
  )

  return matches.length >= 3
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
  if (/^https?:\/\//i.test(path)) return normalizeSeoImageDomain(path)
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function getImageBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    DEFAULT_IMAGE_BASE_URL
  ).replace(/\/$/, '')
}

export function normalizeSeoImageDomain(value: string): string {
  try {
    const url = new URL(value)
    const shouldRewrite =
      url.hostname.endsWith('.r2.dev') ||
      url.hostname.includes('r2.cloudflarestorage.com') ||
      url.hostname === 'images.uomarchive.com'

    if (!shouldRewrite) {
      return value
    }

    const normalizedPath = url.pathname.replace(/^\/uom-archive\//, '/').replace(/^\/+/, '')
    return `${getImageBaseUrl()}/${normalizedPath}`
  } catch {
    return value
  }
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
  return getSeoSocialImageUrl(branding, imageUrl)
}

export function getSeoLogoUrl(branding?: SeoBranding | null): string {
  return branding?.logoUrl ?? DEFAULT_LOGO_PATH
}

export function getSeoSocialImageUrl(
  branding?: SeoBranding | null,
  imageUrl?: string | null,
): string {
  return imageUrl ?? branding?.logoUrl ?? DEFAULT_LOGO_PATH
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
  const imageUrl = buildAbsoluteUrl(getSeoSocialImageUrl(branding, image), baseUrl)
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
      images: [{ url: imageUrl, alt: fullTitle }],
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
