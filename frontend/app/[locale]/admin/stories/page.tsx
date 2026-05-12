'use client'

import { CheckCircle2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { SeoSnippetPreview } from '@/components/admin/SeoSnippetPreview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBranding } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { pingStorySeo } from '@/lib/seo-ping'
import {
  getStorySlug,
  parseStories,
  serializeStories,
  stripHtmlTags,
  STORIES_CONTENT_KEY,
  type StoryItem,
} from '@/lib/stories'

const EMPTY_STORY: Omit<StoryItem, 'id'> = {
  slug: '',
  slugVi: '',
  slugEn: '',
  isVisible: true,
  titleVi: '',
  titleEn: '',
  summaryVi: '',
  summaryEn: '',
  contentVi: '',
  contentEn: '',
  imageUrl: '',
  publishedAt: '',
  updatedAt: '',
}

export default function AdminStoriesPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const { toast } = useToast()
  const { data: branding } = useBranding()

  const [stories, setStories] = useState<StoryItem[]>([])
  const [draft, setDraft] = useState(EMPTY_STORY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null)
  const [lastUpdatedTitle, setLastUpdatedTitle] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden'>('all')
  const [pendingPublishPingIds, setPendingPublishPingIds] = useState<string[]>([])

  useEffect(() => {
    const loadStories = async () => {
      try {
        const siteContent = await api.getSiteContent()
        setStories(parseStories(siteContent[STORIES_CONTENT_KEY]))
      } catch {
        toast({ title: t('error'), description: t('stories.loadError'), variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }

    loadStories()
  }, [t, toast])

  const editingStory = useMemo(
    () => stories.find((story) => story.id === editingId),
    [stories, editingId],
  )

  const displayedStories = useMemo(() => {
    if (filterMode === 'visible') {
      return stories.filter((story) => story.isVisible !== false)
    }

    if (filterMode === 'hidden') {
      return stories.filter((story) => story.isVisible === false)
    }

    return stories
  }, [filterMode, stories])

  const buildAutoSlugs = (
    value: Pick<StoryItem, 'id' | 'slug' | 'slugVi' | 'slugEn' | 'titleVi' | 'titleEn'>,
  ) => ({
    slugVi: getStorySlug(value, 'vi'),
    slugEn: getStorySlug(value, 'en'),
  })

  useEffect(() => {
    const tempId = editingId || 'draft-story'
    const next = buildAutoSlugs({
      id: tempId,
      slug: '',
      slugVi: draft.slugVi,
      slugEn: draft.slugEn,
      titleVi: draft.titleVi,
      titleEn: draft.titleEn,
    })

    if (next.slugVi !== draft.slugVi || next.slugEn !== draft.slugEn) {
      setDraft((prev) => ({ ...prev, ...next, slug: next.slugEn }))
    }
  }, [draft.slugEn, draft.slugVi, draft.titleEn, draft.titleVi, editingId])

  const resetDraft = () => {
    setDraft(EMPTY_STORY)
    setEditingId(null)
    setIsFormOpen(false)
  }

  const openCreateForm = () => {
    setDraft(EMPTY_STORY)
    setEditingId(null)
    setIsFormOpen(true)
  }

  const restoreScrollPosition = (scrollY: number) => {
    const restore = () => {
      window.scrollTo({ top: scrollY, behavior: 'auto' })
    }

    window.requestAnimationFrame(() => {
      restore()
      window.requestAnimationFrame(restore)
    })
  }

  const scrollToStoryCard = (storyId: string) => {
    const element = document.querySelector<HTMLElement>(`[data-story-id="${storyId}"]`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const upload = await api.uploadImage(file, 'stories')
      setDraft((prev) => ({ ...prev, imageUrl: upload.url }))
      toast({ title: t('success'), description: t('stories.imageUploaded') })
    } catch {
      toast({
        title: t('error'),
        description: t('stories.imageUploadError'),
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleEdit = (story: StoryItem) => {
    const currentScrollY = window.scrollY

    setActiveCardId(story.id)
    setIsFormOpen(true)
    setEditingId(story.id)
    setDraft({
      slug: story.slug,
      slugVi: story.slugVi,
      slugEn: story.slugEn,
      isVisible: story.isVisible,
      titleVi: story.titleVi,
      titleEn: story.titleEn,
      summaryVi: story.summaryVi,
      summaryEn: story.summaryEn,
      contentVi: story.contentVi,
      contentEn: story.contentEn,
      imageUrl: story.imageUrl,
      publishedAt: story.publishedAt || '',
      updatedAt: story.updatedAt || '',
    })

    restoreScrollPosition(currentScrollY)

    toast({
      title: t('success'),
      description: locale === 'vi' ? 'Đang chỉnh sửa story đã chọn.' : 'Editing selected story.',
    })

    window.setTimeout(() => {
      setActiveCardId(null)
    }, 320)
  }

  const handleUpsert = () => {
    const updatedAt = new Date().toISOString()

    if (
      !draft.titleVi.trim() ||
      !draft.titleEn.trim() ||
      !draft.summaryVi.trim() ||
      !draft.summaryEn.trim() ||
      !draft.contentVi.trim() ||
      !draft.contentEn.trim() ||
      !draft.imageUrl.trim()
    ) {
      toast({ title: t('error'), description: t('stories.requiredFields'), variant: 'destructive' })
      return
    }

    if (editingId) {
      const targetId = editingId
      const previousStory = stories.find((story) => story.id === targetId)
      const shouldPingOnSave =
        previousStory?.isVisible === false && (draft.isVisible === undefined || draft.isVisible)

      setStories((prev) =>
        prev.map((story) =>
          story.id === editingId
            ? {
                ...story,
                ...draft,
                ...buildAutoSlugs({
                  id: story.id,
                  slug: '',
                  slugVi: draft.slugVi,
                  slugEn: draft.slugEn,
                  titleVi: draft.titleVi,
                  titleEn: draft.titleEn,
                }),
                slug: getStorySlug(
                  {
                    id: story.id,
                    slug: '',
                    slugVi: draft.slugVi,
                    slugEn: draft.slugEn,
                    titleVi: draft.titleVi,
                    titleEn: draft.titleEn,
                  },
                  'en',
                ),
                publishedAt: draft.publishedAt?.trim() || undefined,
                updatedAt,
              }
            : story,
        ),
      )

      setDraft((prev) => ({
        ...prev,
        publishedAt: prev.publishedAt?.trim() || '',
        updatedAt,
      }))
      if (shouldPingOnSave) {
        setPendingPublishPingIds((prev) => Array.from(new Set([...prev, targetId])))
      }
      setJustUpdatedId(targetId)
      setLastUpdatedTitle((locale === 'vi' ? draft.titleVi : draft.titleEn).trim())
      toast({
        title: t('success'),
        description: locale === 'vi' ? 'Đã cập nhật story.' : 'Story updated successfully.',
      })

      window.setTimeout(() => {
        setJustUpdatedId((prev) => (prev === targetId ? null : prev))
      }, 1500)
    } else {
      const newId = crypto.randomUUID()
      setStories((prev) => [
        {
          id: newId,
          ...draft,
          ...buildAutoSlugs({
            id: newId,
            slug: '',
            slugVi: draft.slugVi,
            slugEn: draft.slugEn,
            titleVi: draft.titleVi,
            titleEn: draft.titleEn,
          }),
          slug: getStorySlug(
            {
              id: newId,
              slug: '',
              slugVi: draft.slugVi,
              slugEn: draft.slugEn,
              titleVi: draft.titleVi,
              titleEn: draft.titleEn,
            },
            'en',
          ),
          publishedAt: draft.publishedAt?.trim() || undefined,
          updatedAt,
        },
        ...prev,
      ])

      toast({
        title: t('success'),
        description: locale === 'vi' ? 'Đã thêm story mới.' : 'New story added.',
      })

      resetDraft()
    }
  }

  const handleDelete = (id: string) => {
    setStories((prev) => prev.filter((story) => story.id !== id))
    if (editingId === id) resetDraft()
  }

  const persistStories = async (
    nextStories: StoryItem[],
    successDescription?: string,
    publishStoryIds: string[] = [],
  ): Promise<boolean> => {
    try {
      await api.updateSiteContent({
        [STORIES_CONTENT_KEY]: serializeStories(nextStories),
      })

      const refreshedSiteContent = await api.getSiteContent()
      const refreshedStories = parseStories(refreshedSiteContent[STORIES_CONTENT_KEY])
      setStories(refreshedStories)

      const expectedHiddenCount = nextStories.filter((story) => story.isVisible === false).length
      const persistedHiddenCount = refreshedStories.filter(
        (story) => story.isVisible === false,
      ).length

      if (expectedHiddenCount !== persistedHiddenCount) {
        toast({
          title: t('error'),
          description:
            locale === 'vi'
              ? 'Server chưa lưu đúng trạng thái ẩn/hiện của stories. Vui lòng kiểm tra backend site-content.'
              : 'Server did not persist story visibility correctly. Please verify site-content backend persistence.',
          variant: 'destructive',
        })
        return false
      }

      if (successDescription) {
        toast({ title: t('success'), description: successDescription })
      }

      const storiesById = new Map(refreshedStories.map((story) => [story.id, story]))
      const storiesToPing = publishStoryIds
        .map((id) => storiesById.get(id))
        .filter((story): story is StoryItem => story !== undefined && story.isVisible !== false)

      for (const story of storiesToPing) {
        void pingStorySeo(getStorySlug(story, 'vi'), getStorySlug(story, 'en'))
      }

      return true
    } catch {
      return false
    }
  }

  const handleToggleVisibility = async (id: string) => {
    const previousStories = stories
    const previousStory = previousStories.find((story) => story.id === id)
    const nextStories = stories.map((story) =>
      story.id === id ? { ...story, isVisible: !story.isVisible } : story,
    )

    setStories(nextStories)

    const updatedStory = nextStories.find((story) => story.id === id)
    const successDescription =
      updatedStory?.isVisible === false
        ? locale === 'vi'
          ? 'Đã ẩn story và lưu thành công.'
          : 'Story hidden and saved successfully.'
        : locale === 'vi'
          ? 'Đã hiện story và lưu thành công.'
          : 'Story shown and saved successfully.'

    const shouldPing = previousStory?.isVisible === false && updatedStory?.isVisible === true
    const didPersist = await persistStories(nextStories, successDescription, shouldPing ? [id] : [])

    if (!didPersist) {
      setStories(previousStories)
      toast({
        title: t('error'),
        description:
          locale === 'vi'
            ? 'Không thể lưu thay đổi hiển thị story.'
            : 'Failed to save story visibility change.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const didPersist = await persistStories(stories, t('stories.saved'), pendingPublishPingIds)
      if (!didPersist) {
        toast({ title: t('error'), description: t('stories.saveError'), variant: 'destructive' })
      } else {
        setPendingPublishPingIds([])
      }
    } catch {
      toast({ title: t('error'), description: t('stories.saveError'), variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-12 text-sm text-muted-foreground">{t('loading')}...</div>
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('stories.title')}</h1>
          <p className="text-muted-foreground">{t('stories.description')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant={filterMode === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterMode('all')}
            className="w-full sm:w-auto"
          >
            {locale === 'vi' ? 'Tất cả story' : 'All stories'}
          </Button>
          <Button
            type="button"
            variant={filterMode === 'visible' ? 'default' : 'outline'}
            onClick={() => setFilterMode('visible')}
            className="w-full sm:w-auto"
          >
            {locale === 'vi' ? 'Chỉ hiện story đang hiển thị' : 'Show visible stories only'}
          </Button>
          <Button
            type="button"
            variant={filterMode === 'hidden' ? 'default' : 'outline'}
            onClick={() => setFilterMode('hidden')}
            className="w-full sm:w-auto"
          >
            {locale === 'vi' ? 'Chỉ hiện story đang ẩn' : 'Show hidden stories only'}
          </Button>
          <Button
            type="button"
            variant={isFormOpen ? 'outline' : 'default'}
            onClick={() => (isFormOpen && !editingStory ? setIsFormOpen(false) : openCreateForm())}
            className="w-full sm:w-auto"
          >
            {isFormOpen && !editingStory
              ? locale === 'vi'
                ? 'Ẩn form thêm story'
                : 'Hide add-story form'
              : t('stories.addStory')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? `${t('loading')}...` : t('stories.saveAll')}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {locale === 'vi'
          ? `Đang hiển thị ${displayedStories.length}/${stories.length} story trong danh sách.`
          : `Showing ${displayedStories.length}/${stories.length} stories in the list.`}
      </p>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStory ? t('stories.editStory') : t('stories.addStory')}</CardTitle>
            <CardDescription>{t('stories.formHint')}</CardDescription>
            {editingStory && (
              <p className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                {locale === 'vi'
                  ? `Đang chỉnh sửa: ${editingStory.titleVi || editingStory.titleEn}`
                  : `Editing: ${editingStory.titleEn || editingStory.titleVi}`}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={draft.titleVi}
                onChange={(event) => setDraft((prev) => ({ ...prev, titleVi: event.target.value }))}
                placeholder={t('stories.titleVi')}
              />
              <Input
                value={draft.titleEn}
                onChange={(event) => setDraft((prev) => ({ ...prev, titleEn: event.target.value }))}
                placeholder={t('stories.titleEn')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={draft.summaryVi}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, summaryVi: event.target.value }))
                }
                placeholder={t('stories.summaryVi')}
              />
              <Input
                value={draft.summaryEn}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, summaryEn: event.target.value }))
                }
                placeholder={t('stories.summaryEn')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SeoSnippetPreview
                locale="vi"
                path={`/vi/journal/${draft.slugVi || 'story-slug'}`}
                title={draft.titleVi || 'Tiêu đề story'}
                description={draft.summaryVi || 'Tóm tắt story sẽ hiển thị ở đây.'}
                branding={branding}
              />
              <SeoSnippetPreview
                locale="en"
                path={`/en/journal/${draft.slugEn || 'story-slug'}`}
                title={draft.titleEn || 'Story title'}
                description={draft.summaryEn || 'The story summary shown in Google appears here.'}
                branding={branding}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('stories.contentVi')}</p>
                <RichTextEditor
                  content={draft.contentVi}
                  onChange={(value) => setDraft((prev) => ({ ...prev, contentVi: value }))}
                  placeholder={t('stories.contentPlaceholderVi')}
                  className="min-h-[300px]"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('stories.contentEn')}</p>
                <RichTextEditor
                  content={draft.contentEn}
                  onChange={(value) => setDraft((prev) => ({ ...prev, contentEn: value }))}
                  placeholder={t('stories.contentPlaceholderEn')}
                  className="min-h-[300px]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Input
                value={draft.imageUrl}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))
                }
                placeholder={t('stories.imageUrl')}
              />
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 text-sm">
                {isUploading ? `${t('loading')}...` : t('stories.uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleUploadImage}
                />
              </label>
            </div>

            <Input
              value={draft.publishedAt}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, publishedAt: event.target.value }))
              }
              placeholder={t('stories.publishedAt')}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button onClick={handleUpsert} className="w-full sm:w-auto">
                {editingStory ? t('stories.updateStory') : t('stories.addStory')}
              </Button>
              {editingStory && (
                <Button variant="outline" onClick={resetDraft} className="w-full sm:w-auto">
                  {t('cancel')}
                </Button>
              )}
            </div>

            {justUpdatedId && (
              <div className="flex flex-col gap-2 rounded-md border border-emerald-300/80 bg-emerald-50 p-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">
                  {locale === 'vi'
                    ? `Đã cập nhật: ${lastUpdatedTitle || 'Story'}`
                    : `Updated: ${lastUpdatedTitle || 'Story'}`}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                  onClick={() => scrollToStoryCard(justUpdatedId)}
                >
                  {locale === 'vi' ? 'Xem story vừa cập nhật' : 'View updated story'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displayedStories.map((story) => {
          const contentViPreview = stripHtmlTags(story.contentVi)
          const contentEnPreview = stripHtmlTags(story.contentEn)
          const isContentViMissing = contentViPreview.length === 0
          const isContentEnMissing = contentEnPreview.length === 0

          return (
            <Card
              key={story.id}
              data-story-id={story.id}
              className={
                activeCardId === story.id
                  ? 'translate-y-[-4px] scale-[1.01] border-primary/30 shadow-md transition-all duration-300'
                  : justUpdatedId === story.id
                    ? 'border-emerald-300/70 shadow-sm shadow-emerald-100 transition-all duration-300'
                    : 'transition-all duration-300'
              }
            >
              <CardContent className="relative space-y-3 p-4">
                {justUpdatedId === story.id && (
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Updated
                  </div>
                )}
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                  <Image
                    src={story.imageUrl}
                    alt={story.titleEn}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="font-semibold">{locale === 'vi' ? story.titleVi : story.titleEn}</h3>
                <div className="inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {story.isVisible
                    ? locale === 'vi'
                      ? 'Hiện'
                      : 'Visible'
                    : locale === 'vi'
                      ? 'Ẩn'
                      : 'Hidden'}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {locale === 'vi' ? story.summaryVi : story.summaryEn}
                </p>
                <div className="space-y-2 rounded-md border border-muted/50 bg-muted/20 p-2">
                  <div
                    className={`rounded-sm px-1.5 py-1 ${isContentViMissing ? 'border border-amber-300/60 bg-amber-50/80' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                        Content VI
                      </p>
                      {isContentViMissing && (
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                          Missing
                        </span>
                      )}
                    </div>
                    {isContentViMissing ? (
                      <p className="text-xs text-muted-foreground">No content</p>
                    ) : (
                      <div
                        className="prose prose-sm prose-p:my-1 prose-p:text-muted-foreground prose-li:my-0 prose-li:text-muted-foreground max-h-20 max-w-none overflow-hidden text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: story.contentVi }}
                      />
                    )}
                  </div>
                  <div
                    className={`rounded-sm px-1.5 py-1 ${isContentEnMissing ? 'border border-amber-300/60 bg-amber-50/80' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                        Content EN
                      </p>
                      {isContentEnMissing && (
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                          Missing
                        </span>
                      )}
                    </div>
                    {isContentEnMissing ? (
                      <p className="text-xs text-muted-foreground">No content</p>
                    ) : (
                      <div
                        className="prose prose-sm prose-p:my-1 prose-p:text-muted-foreground prose-li:my-0 prose-li:text-muted-foreground max-h-20 max-w-none overflow-hidden text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: story.contentEn }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={editingId === story.id ? 'default' : 'outline'}
                    onClick={() => handleEdit(story)}
                  >
                    {editingId === story.id
                      ? locale === 'vi'
                        ? 'Đang sửa'
                        : 'Editing'
                      : t('edit')}
                  </Button>
                  {story.isVisible && (
                    <a
                      href={`/${locale}/journal/${encodeURIComponent(getStorySlug(story, locale as 'vi' | 'en'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title={
                        locale === 'vi'
                          ? 'Xem story ngoài trang public'
                          : 'View story on public site'
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVisibility(story.id)}
                  >
                    {story.isVisible
                      ? locale === 'vi'
                        ? 'Ẩn'
                        : 'Hide'
                      : locale === 'vi'
                        ? 'Hiện'
                        : 'Show'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(story.id)}>
                    {t('delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
