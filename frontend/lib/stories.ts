export const STORIES_CONTENT_KEY = 'journal.stories'

export interface StoryItem {
  id: string
  slug: string
  slugVi: string
  slugEn: string
  isVisible: boolean
  titleVi: string
  titleEn: string
  summaryVi: string
  summaryEn: string
  contentVi: string
  contentEn: string
  imageUrl: string
  publishedAt?: string
  updatedAt?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }

  return fallback
}

export function toStorySlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function buildFallbackSlug(id: string, titleVi: string, titleEn: string): string {
  const base = normalizeText(titleEn) || normalizeText(titleVi) || id
  const generated = toStorySlug(base)
  const suffix = normalizeText(id).slice(0, 8)
  return generated ? `${generated}-${suffix}` : suffix || 'story'
}

export function getStorySlug(
  story: Pick<StoryItem, 'id' | 'slug' | 'slugVi' | 'slugEn' | 'titleVi' | 'titleEn'>,
  locale: 'vi' | 'en' = 'en',
): string {
  const preferred =
    locale === 'vi'
      ? normalizeText(story.slugVi || story.slug)
      : normalizeText(story.slugEn || story.slug)

  if (preferred) {
    return toStorySlug(preferred)
  }

  return buildFallbackSlug(story.id, story.titleVi, story.titleEn)
}

export function stripHtmlTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getStoryBySlug(
  stories: StoryItem[],
  slug: string,
  locale: 'vi' | 'en' = 'en',
): StoryItem | undefined {
  const target = toStorySlug(slug)

  return stories.find((story) => {
    if (getStorySlug(story, locale) === target) {
      return true
    }

    const legacyCandidates = [story.slug, story.slugVi, story.slugEn]
      .map((value) => normalizeText(value))
      .filter((value) => value.length > 0)
      .map((value) => toStorySlug(value))

    return legacyCandidates.includes(target)
  })
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
        slug: '',
        slugVi: '',
        slugEn: '',
        isVisible: normalizeBoolean(source.isVisible, true),
        titleVi: source.titleVi,
        titleEn: source.titleEn,
        summaryVi: source.summaryVi,
        summaryEn: source.summaryEn,
        contentVi:
          normalizeText((source as Partial<StoryItem> & { contentVi?: unknown }).contentVi) ||
          source.summaryVi,
        contentEn:
          normalizeText((source as Partial<StoryItem> & { contentEn?: unknown }).contentEn) ||
          source.summaryEn,
        imageUrl: source.imageUrl,
        ...(isNonEmptyString(source.publishedAt) ? { publishedAt: source.publishedAt } : {}),
        ...(isNonEmptyString(source.updatedAt) ? { updatedAt: source.updatedAt } : {}),
      })

      const added = acc[acc.length - 1]
      const sourceSlug = normalizeText((source as Partial<StoryItem> & { slug?: unknown }).slug)
      const sourceSlugVi = normalizeText(
        (source as Partial<StoryItem> & { slugVi?: unknown }).slugVi,
      )
      const sourceSlugEn = normalizeText(
        (source as Partial<StoryItem> & { slugEn?: unknown }).slugEn,
      )

      const fallback = buildFallbackSlug(added.id, added.titleVi, added.titleEn)
      const viSlug = toStorySlug(sourceSlugVi || added.titleVi || sourceSlug || fallback)
      const enSlug = toStorySlug(sourceSlugEn || added.titleEn || sourceSlug || fallback)

      added.slugVi = viSlug || fallback
      added.slugEn = enSlug || fallback
      added.slug = toStorySlug(sourceSlug || added.slugEn) || added.slugEn
      if (!added.updatedAt) {
        added.updatedAt = added.publishedAt
      }

      return acc
    }, [])
  } catch {
    return []
  }
}

export function serializeStories(stories: StoryItem[]): string {
  return JSON.stringify(
    stories.map((story) => ({
      ...story,
      slugVi: getStorySlug(story, 'vi'),
      slugEn: getStorySlug(story, 'en'),
      slug: getStorySlug(story, 'en'),
      isVisible: story.isVisible !== false,
      titleVi: story.titleVi.trim(),
      titleEn: story.titleEn.trim(),
      summaryVi: story.summaryVi.trim(),
      summaryEn: story.summaryEn.trim(),
      contentVi: story.contentVi.trim(),
      contentEn: story.contentEn.trim(),
      imageUrl: story.imageUrl.trim(),
      ...(story.publishedAt?.trim() ? { publishedAt: story.publishedAt.trim() } : {}),
      ...(story.updatedAt?.trim() ? { updatedAt: story.updatedAt.trim() } : {}),
    })),
  )
}
