export const SEARCH_TRENDING_VI_KEY = 'search.trending.vi'
export const SEARCH_TRENDING_EN_KEY = 'search.trending.en'

const DEFAULT_TRENDING_VI = ['binh gom', 'chen tra', 'men ran', 'bo suu tap moi', 'lo hoa toi gian']
const DEFAULT_TRENDING_EN = [
  'ceramic vase',
  'tea cup',
  'crackle glaze',
  'new collection',
  'minimal decor',
]

export function parseTrendingTerms(raw: unknown, locale: 'vi' | 'en'): string[] {
  if (!raw || typeof raw !== 'string') {
    return locale === 'vi' ? DEFAULT_TRENDING_VI : DEFAULT_TRENDING_EN
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .slice(0, 12)

      if (normalized.length > 0) {
        return normalized
      }
    }
  } catch {
    const normalized = raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 12)

    if (normalized.length > 0) {
      return normalized
    }
  }

  return locale === 'vi' ? DEFAULT_TRENDING_VI : DEFAULT_TRENDING_EN
}

export function serializeTrendingTerms(values: string[]): string {
  return JSON.stringify(
    values
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 12),
  )
}
