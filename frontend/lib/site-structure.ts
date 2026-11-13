import type { SiteContent } from './types'

export type SitePage = {
  slug: string
  titleVi: string
  titleEn: string
  descriptionVi: string
  descriptionEn: string
  contentVi: string
  contentEn: string
  isVisible: boolean
}

export type HomeSection = {
  key: string
  titleVi: string
  titleEn: string
  subtitleVi: string
  subtitleEn: string
  bodyVi?: string
  bodyEn?: string
  isVisible: boolean
}

export const SITE_PAGES_KEY = 'site.pages'
export const HOME_SECTIONS_KEY = 'site.sections'
export const BUILTIN_PAGE_SLUGS = ['home', 'shop', 'about', 'journal', 'contact'] as const

export const DEFAULT_SITE_PAGES: SitePage[] = [
  {
    slug: 'home',
    titleVi: 'Trang chủ',
    titleEn: 'Home',
    descriptionVi: '',
    descriptionEn: '',
    contentVi: '',
    contentEn: '',
    isVisible: true,
  },
  {
    slug: 'shop',
    titleVi: 'Sản phẩm',
    titleEn: 'Shop',
    descriptionVi: 'Khám phá các món gốm thủ công đang có tại ƯƠM.',
    descriptionEn: 'Explore handcrafted ceramic pieces curated by UOM.',
    contentVi: '',
    contentEn: '',
    isVisible: true,
  },
  {
    slug: 'about',
    titleVi: 'Về chúng tôi',
    titleEn: 'About Us',
    descriptionVi: 'Tìm hiểu triết lý tuyển chọn và câu chuyện của ƯƠM.',
    descriptionEn: 'Learn about the curation philosophy and story behind UOM.',
    contentVi: '',
    contentEn: '',
    isVisible: true,
  },
  {
    slug: 'journal',
    titleVi: 'Tạp chí',
    titleEn: 'Journal',
    descriptionVi: 'Đọc câu chuyện về chất liệu, nghệ nhân và không gian sống.',
    descriptionEn: 'Read stories about materials, artisans, and living spaces.',
    contentVi: '',
    contentEn: '',
    isVisible: true,
  },
  {
    slug: 'contact',
    titleVi: 'Liên hệ',
    titleEn: 'Contact',
    descriptionVi: 'Gửi yêu cầu tư vấn hoặc đặt hàng qua các kênh của ƯƠM.',
    descriptionEn: 'Send an inquiry or order request through UOM channels.',
    contentVi: '',
    contentEn: '',
    isVisible: true,
  },
]

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { key: 'hero', titleVi: '', titleEn: '', subtitleVi: '', subtitleEn: '', isVisible: true },
  {
    key: 'products',
    titleVi: 'BST MỚI NHẤT',
    titleEn: 'NEW COLLECTIONS',
    subtitleVi: 'Sản phẩm gợi ý',
    subtitleEn: 'Suggested for you',
    isVisible: true,
  },
  {
    key: 'journal',
    titleVi: 'JOURNAL',
    titleEn: 'JOURNAL',
    subtitleVi: 'Nhật ký & Câu chuyện',
    subtitleEn: 'Stories & Journal',
    bodyVi: 'Stories đang được cập nhật. Xem lại sau nhé.',
    bodyEn: 'Stories are being updated. Please check back soon.',
    isVisible: true,
  },
  {
    key: 'explore',
    titleVi: 'KHÁM PHÁ ƯƠM',
    titleEn: 'EXPLORE UOM',
    subtitleVi: 'Các trang trong website',
    subtitleEn: 'Pages in this website',
    isVisible: true,
  },
]

function parseJsonArray(value?: string): unknown[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as unknown[]) : []
  } catch {
    return []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSitePage(value: unknown): value is SitePage {
  if (!isRecord(value)) return false
  return (
    typeof value.slug === 'string' &&
    /^[a-z0-9-]{1,60}$/.test(value.slug) &&
    typeof value.titleVi === 'string' &&
    typeof value.titleEn === 'string' &&
    typeof value.descriptionVi === 'string' &&
    typeof value.descriptionEn === 'string' &&
    typeof value.contentVi === 'string' &&
    typeof value.contentEn === 'string' &&
    typeof value.isVisible === 'boolean'
  )
}

function isHomeSection(value: unknown): value is HomeSection {
  if (!isRecord(value)) return false
  return (
    typeof value.key === 'string' &&
    (['hero', 'products', 'journal', 'explore'].includes(value.key) ||
      /^custom-[a-z0-9-]+$/.test(value.key)) &&
    typeof value.titleVi === 'string' &&
    typeof value.titleEn === 'string' &&
    typeof value.subtitleVi === 'string' &&
    typeof value.subtitleEn === 'string' &&
    (value.bodyVi === undefined || typeof value.bodyVi === 'string') &&
    (value.bodyEn === undefined || typeof value.bodyEn === 'string') &&
    typeof value.isVisible === 'boolean'
  )
}

export function parseSitePages(content?: SiteContent): SitePage[] {
  const valid = parseJsonArray(content?.[SITE_PAGES_KEY]).filter(isSitePage)
  return [
    ...DEFAULT_SITE_PAGES.map(
      (fallback) => valid.find((item) => item.slug === fallback.slug) ?? fallback,
    ),
    ...valid.filter(
      (item) => !BUILTIN_PAGE_SLUGS.includes(item.slug as (typeof BUILTIN_PAGE_SLUGS)[number]),
    ),
  ]
}

export function parseHomeSections(content?: SiteContent): HomeSection[] {
  const valid = parseJsonArray(content?.[HOME_SECTIONS_KEY]).filter(isHomeSection)
  return [
    ...DEFAULT_HOME_SECTIONS.map((fallback) => ({
      ...fallback,
      ...valid.find((item) => item.key === fallback.key),
    })),
    ...valid.filter((item) => item.key.startsWith('custom-')),
  ]
}

export function pageHref(locale: string, slug: string): string {
  if (slug === 'home') return `/${locale}`
  if (slug === 'contact') return `/${locale}/about#contact`
  if (BUILTIN_PAGE_SLUGS.includes(slug as (typeof BUILTIN_PAGE_SLUGS)[number]))
    return `/${locale}/${slug}`
  return `/${locale}/pages/${slug}`
}
