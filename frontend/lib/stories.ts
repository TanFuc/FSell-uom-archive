export const STORIES_CONTENT_KEY = 'journal.stories'

export interface StoryItem {
  id: string
  titleVi: string
  titleEn: string
  summaryVi: string
  summaryEn: string
  imageUrl: string
  publishedAt?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function parseStories(raw: unknown): StoryItem[] {
  if (!raw || typeof raw !== 'string') return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.reduce<StoryItem[]>((acc, item) => {
      if (!item || typeof item !== 'object') return acc
      const source = item as Partial<StoryItem>

      if (
        !isNonEmptyString(source.id) ||
        !isNonEmptyString(source.titleVi) ||
        !isNonEmptyString(source.titleEn) ||
        !isNonEmptyString(source.summaryVi) ||
        !isNonEmptyString(source.summaryEn) ||
        !isNonEmptyString(source.imageUrl)
      ) {
        return acc
      }

      acc.push({
        id: source.id,
        titleVi: source.titleVi,
        titleEn: source.titleEn,
        summaryVi: source.summaryVi,
        summaryEn: source.summaryEn,
        imageUrl: source.imageUrl,
        ...(isNonEmptyString(source.publishedAt) ? { publishedAt: source.publishedAt } : {}),
      })

      return acc
    }, [])
  } catch {
    return []
  }
}

export function serializeStories(stories: StoryItem[]): string {
  return JSON.stringify(stories)
}
