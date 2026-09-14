'use client'

import { CheckCircle2, ExternalLink, Zap, RefreshCw, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { SeoSnippetPreview } from '@/components/admin/SeoSnippetPreview'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBranding } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/use-confirm'
import { api } from '@/lib/api'
import { pingStorySeo } from '@/lib/seo-ping'
import { revalidatePaths } from '@/lib/revalidate'
import { cn } from '@/lib/utils'
import {
  getStorySlug,
  parseStories,
  serializeStories,
  stripHtmlTags,
  toStorySlug,
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
  seoTitleVi: '',
  seoTitleEn: '',
  seoDescriptionVi: '',
  seoDescriptionEn: '',
  seoKeywordsVi: '',
  seoKeywordsEn: '',
  canonicalUrl: '',
  noIndex: false,
}

export default function AdminStoriesPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const { toast } = useToast()
  const confirm = useConfirm()
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
  const [isPingingId, setIsPingingId] = useState<string | null>(null)

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
      seoTitleVi: story.seoTitleVi || '',
      seoTitleEn: story.seoTitleEn || '',
      seoDescriptionVi: story.seoDescriptionVi || '',
      seoDescriptionEn: story.seoDescriptionEn || '',
      seoKeywordsVi: story.seoKeywordsVi || '',
      seoKeywordsEn: story.seoKeywordsEn || '',
      canonicalUrl: story.canonicalUrl || '',
      noIndex: story.noIndex || false,
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

  const handlePingGoogle = async (story: StoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setIsPingingId(story.id)

    try {
      const viSlug = getStorySlug(story, 'vi')
      const enSlug = getStorySlug(story, 'en')
      const pathsToRevalidate = [
        `/vi/journal/${encodeURIComponent(viSlug)}`,
        `/en/journal/${encodeURIComponent(enSlug)}`,
        '/vi/journal',
        '/en/journal',
        '/vi',
        '/en',
        '/sitemap.xml',
      ]

      const [revalResult] = await Promise.all([
        revalidatePaths(pathsToRevalidate),
        pingStorySeo(viSlug, enSlug),
      ])

      if (revalResult.success) {
        toast({
          title: locale === 'vi' ? 'Làm mới chỉ mục thành công' : 'SEO Indexing Refreshed',
          description:
            locale === 'vi'
              ? `Đã xóa cache & gửi yêu cầu làm mới chỉ mục tới Googlebot & IndexNow cho story "${story.titleVi || story.titleEn}".`
              : `Cache cleared & indexing signal sent to Googlebot and IndexNow for story "${story.titleEn || story.titleVi}".`,
        })
      } else {
        throw new Error(revalResult.message || 'Làm mới cache thất bại')
      }
    } catch (error: any) {
      toast({
        title: locale === 'vi' ? 'Lỗi làm mới chỉ mục' : 'Indexing Refresh Error',
        description:
          error?.message ||
          (locale === 'vi'
            ? 'Không thể làm mới chỉ mục lúc này'
            : 'Could not refresh index at this time'),
        variant: 'destructive',
      })
    } finally {
      setIsPingingId(null)
    }
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
        .filter((story): story is StoryItem => story !== undefined && story.isVisible !== false && !story.noIndex)

      for (const story of storiesToPing) {
        const viSlug = getStorySlug(story, 'vi')
        const enSlug = getStorySlug(story, 'en')
        void pingStorySeo(viSlug, enSlug)
        void revalidatePaths([
          `/vi/journal/${encodeURIComponent(viSlug)}`,
          `/en/journal/${encodeURIComponent(enSlug)}`,
        ])
      }

      void revalidatePaths(['/vi', '/en', '/vi/journal', '/en/journal', '/sitemap.xml'])

      return true
    } catch (err: any) {
      toast({
        title: t('error'),
        description: err?.response?.data?.message || err?.message || t('stories.saveError'),
        variant: 'destructive',
      })
      return false
    }
  }

  const handleUpsert = async () => {
    const updatedAt = new Date().toISOString()

    const missingFields: string[] = []
    if (!draft.titleVi.trim()) missingFields.push(locale === 'vi' ? 'Tiêu đề (VI)' : 'Title (VI)')
    if (!draft.titleEn.trim()) missingFields.push(locale === 'vi' ? 'Tiêu đề (EN)' : 'Title (EN)')
    if (!draft.summaryVi.trim()) missingFields.push(locale === 'vi' ? 'Tóm tắt (VI)' : 'Summary (VI)')
    if (!draft.summaryEn.trim()) missingFields.push(locale === 'vi' ? 'Tóm tắt (EN)' : 'Summary (EN)')
    if (!draft.contentVi.trim()) missingFields.push(locale === 'vi' ? 'Nội dung (VI)' : 'Content (VI)')
    if (!draft.contentEn.trim()) missingFields.push(locale === 'vi' ? 'Nội dung (EN)' : 'Content (EN)')
    if (!draft.imageUrl.trim()) missingFields.push(locale === 'vi' ? 'Ảnh story' : 'Story image')

    if (missingFields.length > 0) {
      toast({
        title: t('error'),
        description:
          locale === 'vi'
            ? `Vui lòng điền đủ các trường bắt buộc: ${missingFields.join(', ')}`
            : `Please fill required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        const targetId = editingId
        const shouldPingOnSave =
          (draft.isVisible === undefined || draft.isVisible) && !draft.noIndex

        const nextStories = stories.map((story) =>
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
        )

        const success = await persistStories(
          nextStories,
          locale === 'vi' ? 'Đã cập nhật story và lưu vào cơ sở dữ liệu thành công.' : 'Story updated and saved successfully.',
          shouldPingOnSave ? [targetId] : [],
        )

        if (success) {
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

          window.setTimeout(() => {
            setJustUpdatedId((prev) => (prev === targetId ? null : prev))
          }, 2000)
        }
      } else {
        const newId = crypto.randomUUID()
        const newStory: StoryItem = {
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
        }
        const nextStories = [newStory, ...stories]

        const success = await persistStories(
          nextStories,
          locale === 'vi' ? 'Đã thêm story mới và lưu vào cơ sở dữ liệu thành công.' : 'New story added and saved successfully.',
          newStory.isVisible !== false && !newStory.noIndex ? [newId] : [],
        )

        if (success) {
          resetDraft()
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const storyToDelete = stories.find((s) => s.id === id)
    const storyTitle = storyToDelete
      ? locale === 'vi'
        ? storyToDelete.titleVi
        : storyToDelete.titleEn
      : ''

    const confirmed = await confirm({
      title: locale === 'vi' ? 'Xóa story?' : 'Delete story?',
      description:
        locale === 'vi'
          ? `Bạn có chắc chắn muốn xóa story "${storyTitle}" khỏi website không? Hành động này sẽ gỡ bài viết khỏi Journal.`
          : `Are you sure you want to delete story "${storyTitle}"? This will remove the article from the Journal.`,
      confirmText: locale === 'vi' ? 'Xóa story' : 'Delete',
      cancelText: locale === 'vi' ? 'Hủy' : 'Cancel',
      variant: 'destructive',
      icon: 'trash',
    })

    if (!confirmed) return

    const nextStories = stories.filter((story) => story.id !== id)
    setIsSaving(true)
    try {
      const success = await persistStories(
        nextStories,
        locale === 'vi' ? 'Đã xóa story và cập nhật website thành công.' : 'Story deleted and website updated successfully.',
      )
      if (success && editingId === id) {
        resetDraft()
      }
    } finally {
      setIsSaving(false)
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('stories.titleVi')} <span className="text-destructive font-bold">*</span>
                </label>
                <Input
                  value={draft.titleVi}
                  onChange={(event) => setDraft((prev) => ({ ...prev, titleVi: event.target.value }))}
                  placeholder={t('stories.titleVi')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('stories.titleEn')} <span className="text-destructive font-bold">*</span>
                </label>
                <Input
                  value={draft.titleEn}
                  onChange={(event) => setDraft((prev) => ({ ...prev, titleEn: event.target.value }))}
                  placeholder={t('stories.titleEn')}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('stories.summaryVi')} <span className="text-destructive font-bold">*</span>
                </label>
                <Input
                  value={draft.summaryVi}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, summaryVi: event.target.value }))
                  }
                  placeholder={t('stories.summaryVi')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('stories.summaryEn')} <span className="text-destructive font-bold">*</span>
                </label>
                <Input
                  value={draft.summaryEn}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, summaryEn: event.target.value }))
                  }
                  placeholder={t('stories.summaryEn')}
                />
              </div>
            </div>

            {/* SEO & Search Indexing Card */}
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900">
                      {locale === 'vi' ? 'Cấu hình SEO & Chỉ mục Google' : 'SEO & Google Indexing Settings'}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {locale === 'vi'
                        ? 'Tùy chỉnh đường dẫn URL, Meta Title, Meta Description và từ khóa tối ưu tìm kiếm'
                        : 'Customize URL slugs, Meta Title, Meta Description and keywords for search engines'}
                    </p>
                  </div>
                </div>
              </div>

              {/* URL Slugs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Đường dẫn SEO (Slug VI)' : 'SEO Slug (VI)'}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          slugVi: toStorySlug(prev.titleVi || ''),
                        }))
                      }
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      {locale === 'vi' ? 'Tự động tạo từ tiêu đề' : 'Generate from title'}
                    </button>
                  </div>
                  <Input
                    value={draft.slugVi || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, slugVi: toStorySlug(e.target.value) }))
                    }
                    placeholder={toStorySlug(draft.titleVi) || 'nhung-ban-tay-giu-lua'}
                    className="font-mono text-xs bg-white"
                  />
                  <p className="text-[11px] text-neutral-500 truncate">
                    URL:{' '}
                    <span className="font-mono text-neutral-700">
                      /vi/journal/{draft.slugVi || toStorySlug(draft.titleVi) || '...'}
                    </span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Đường dẫn SEO (Slug EN)' : 'SEO Slug (EN)'}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          slugEn: toStorySlug(prev.titleEn || ''),
                        }))
                      }
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      {locale === 'vi' ? 'Tự động tạo từ tiêu đề' : 'Generate from title'}
                    </button>
                  </div>
                  <Input
                    value={draft.slugEn || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, slugEn: toStorySlug(e.target.value) }))
                    }
                    placeholder={toStorySlug(draft.titleEn) || 'hands-that-keep-the-fire'}
                    className="font-mono text-xs bg-white"
                  />
                  <p className="text-[11px] text-neutral-500 truncate">
                    URL:{' '}
                    <span className="font-mono text-neutral-700">
                      /en/journal/{draft.slugEn || toStorySlug(draft.titleEn) || '...'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Meta Titles */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Tiêu đề SEO (Meta Title VI)' : 'Meta Title (VI)'}
                    </label>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        (draft.seoTitleVi || draft.titleVi).length > 60
                          ? 'text-amber-600 font-bold'
                          : (draft.seoTitleVi || draft.titleVi).length >= 40
                            ? 'text-emerald-600 font-medium'
                            : 'text-neutral-500',
                      )}
                    >
                      {(draft.seoTitleVi || draft.titleVi).length}/60
                    </span>
                  </div>
                  <Input
                    value={draft.seoTitleVi || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoTitleVi: e.target.value }))
                    }
                    placeholder={draft.titleVi || (locale === 'vi' ? 'Mặc định lấy từ tiêu đề bài viết' : 'Default from story title')}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Tiêu đề SEO (Meta Title EN)' : 'Meta Title (EN)'}
                    </label>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        (draft.seoTitleEn || draft.titleEn).length > 60
                          ? 'text-amber-600 font-bold'
                          : (draft.seoTitleEn || draft.titleEn).length >= 40
                            ? 'text-emerald-600 font-medium'
                            : 'text-neutral-500',
                      )}
                    >
                      {(draft.seoTitleEn || draft.titleEn).length}/60
                    </span>
                  </div>
                  <Input
                    value={draft.seoTitleEn || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoTitleEn: e.target.value }))
                    }
                    placeholder={draft.titleEn || (locale === 'vi' ? 'Mặc định lấy từ tiêu đề bài viết' : 'Default from story title')}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Meta Descriptions */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Mô tả SEO (Meta Description VI)' : 'Meta Description (VI)'}
                    </label>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        (draft.seoDescriptionVi || draft.summaryVi).length > 160
                          ? 'text-amber-600 font-bold'
                          : (draft.seoDescriptionVi || draft.summaryVi).length >= 120
                            ? 'text-emerald-600 font-medium'
                            : 'text-neutral-500',
                      )}
                    >
                      {(draft.seoDescriptionVi || draft.summaryVi).length}/160
                    </span>
                  </div>
                  <Input
                    value={draft.seoDescriptionVi || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoDescriptionVi: e.target.value }))
                    }
                    placeholder={draft.summaryVi || (locale === 'vi' ? 'Mặc định lấy từ tóm tắt' : 'Default from summary')}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800">
                      {locale === 'vi' ? 'Mô tả SEO (Meta Description EN)' : 'Meta Description (EN)'}
                    </label>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        (draft.seoDescriptionEn || draft.summaryEn).length > 160
                          ? 'text-amber-600 font-bold'
                          : (draft.seoDescriptionEn || draft.summaryEn).length >= 120
                            ? 'text-emerald-600 font-medium'
                            : 'text-neutral-500',
                      )}
                    >
                      {(draft.seoDescriptionEn || draft.summaryEn).length}/160
                    </span>
                  </div>
                  <Input
                    value={draft.seoDescriptionEn || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoDescriptionEn: e.target.value }))
                    }
                    placeholder={draft.summaryEn || (locale === 'vi' ? 'Mặc định lấy từ tóm tắt' : 'Default from summary')}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* SEO Keywords */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    {locale === 'vi' ? 'Từ khóa SEO (VI)' : 'Keywords (VI)'}
                  </label>
                  <Input
                    value={draft.seoKeywordsVi || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoKeywordsVi: e.target.value }))
                    }
                    placeholder={locale === 'vi' ? 'gốm thủ công, nghệ nhân gốm, câu chuyện gốm sứ' : 'vietnamese ceramics, artisan pottery'}
                    className="bg-white"
                  />
                  <p className="text-[10px] text-neutral-500">
                    {locale === 'vi' ? 'Phân cách các từ khóa bằng dấu phẩy (,)' : 'Separate keywords with commas (,)'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    {locale === 'vi' ? 'Từ khóa SEO (EN)' : 'Keywords (EN)'}
                  </label>
                  <Input
                    value={draft.seoKeywordsEn || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, seoKeywordsEn: e.target.value }))
                    }
                    placeholder="vietnamese ceramics, pottery journal, handcrafted stories"
                    className="bg-white"
                  />
                  <p className="text-[10px] text-neutral-500">
                    {locale === 'vi' ? 'Phân cách các từ khóa bằng dấu phẩy (,)' : 'Separate keywords with commas (,)'}
                  </p>
                </div>
              </div>

              {/* Advanced Options & Noindex */}
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-neutral-200/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800">
                    {locale === 'vi' ? 'URL Canonical tùy biến (nếu có)' : 'Custom Canonical URL'}
                  </label>
                  <Input
                    value={draft.canonicalUrl || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, canonicalUrl: e.target.value }))
                    }
                    placeholder="https://www.uomarchive.com/vi/journal/..."
                    className="font-mono text-xs bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="noIndexToggle"
                    checked={draft.noIndex || false}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, noIndex: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="noIndexToggle" className="text-xs text-neutral-800 cursor-pointer select-none">
                    <span className="font-semibold text-destructive">
                      {locale === 'vi' ? 'Chặn Google lập chỉ mục (noindex)' : 'Block Google from indexing (noindex)'}
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      {locale === 'vi'
                        ? 'Bật tùy chọn này nếu bài viết đang nháp hoặc không muốn xuất hiện trên kết quả tìm kiếm'
                        : 'Enable this if the story is a draft or should not appear in search engine results'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Live Google Snippet Previews */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-neutral-600 mb-2">
                  {locale === 'vi' ? 'Xem trước kết quả tìm kiếm Google (SERP Preview):' : 'Google SERP Preview:'}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <SeoSnippetPreview
                    locale="vi"
                    path={`/vi/journal/${draft.slugVi || toStorySlug(draft.titleVi) || 'story-slug'}`}
                    title={draft.seoTitleVi || draft.titleVi || 'Tiêu đề story'}
                    description={draft.seoDescriptionVi || draft.summaryVi || 'Tóm tắt story sẽ hiển thị ở đây.'}
                    branding={branding}
                  />
                  <SeoSnippetPreview
                    locale="en"
                    path={`/en/journal/${draft.slugEn || toStorySlug(draft.titleEn) || 'story-slug'}`}
                    title={draft.seoTitleEn || draft.titleEn || 'Story title'}
                    description={draft.seoDescriptionEn || draft.summaryEn || 'The story summary shown in Google appears here.'}
                    branding={branding}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  {t('stories.contentVi')} <span className="text-destructive font-bold">*</span>
                </p>
                <RichTextEditor
                  content={draft.contentVi}
                  onChange={(value) => setDraft((prev) => ({ ...prev, contentVi: value }))}
                  placeholder={t('stories.contentPlaceholderVi')}
                  className="min-h-[300px]"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  {t('stories.contentEn')} <span className="text-destructive font-bold">*</span>
                </p>
                <RichTextEditor
                  content={draft.contentEn}
                  onChange={(value) => setDraft((prev) => ({ ...prev, contentEn: value }))}
                  placeholder={t('stories.contentPlaceholderEn')}
                  className="min-h-[300px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('stories.imageUrl')} <span className="text-destructive font-bold">*</span>
              </label>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  value={draft.imageUrl}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, imageUrl: event.target.value }))
                  }
                  placeholder={t('stories.imageUrl')}
                />
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 text-sm hover:bg-accent">
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('stories.publishedAt')}
              </label>
              <Input
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, publishedAt: event.target.value }))
                }
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-2">
              <Button onClick={handleUpsert} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? `${t('loading')}...` : editingStory ? t('stories.updateStory') : t('stories.addStory')}
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
              className={cn(
                'flex flex-col h-full transition-all duration-300',
                activeCardId === story.id
                  ? 'translate-y-[-4px] scale-[1.01] border-primary/30 shadow-md'
                  : justUpdatedId === story.id
                    ? 'border-emerald-300/70 shadow-sm shadow-emerald-100'
                    : 'hover:shadow-sm',
              )}
            >
              <CardContent className="relative flex flex-col flex-1 p-4 space-y-3">
                {justUpdatedId === story.id && (
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm z-10">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Updated
                  </div>
                )}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted border border-border/40">
                  <Image
                    src={story.imageUrl}
                    alt={story.titleEn}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold text-base line-clamp-1 h-6 text-foreground"
                    title={locale === 'vi' ? story.titleVi : story.titleEn}
                  >
                    {locale === 'vi' ? story.titleVi : story.titleEn}
                  </h3>
                </div>
                <div>
                  <div
                    className={cn(
                      'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide border transition-colors',
                      story.isVisible
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-500',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        story.isVisible ? 'bg-emerald-500' : 'bg-neutral-400',
                      )}
                    />
                    {story.isVisible
                      ? locale === 'vi'
                        ? 'Hiện'
                        : 'Visible'
                      : locale === 'vi'
                        ? 'Ẩn'
                        : 'Hidden'}
                  </div>
                  {story.noIndex && (
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                      Noindex
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground h-9 leading-relaxed">
                  {(locale === 'vi' ? story.summaryVi : story.summaryEn) || '—'}
                </p>
                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                  <div
                    className={cn(
                      'rounded px-1.5 py-1',
                      isContentViMissing ? 'border border-amber-300/60 bg-amber-50/80' : '',
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">
                        Content VI
                      </span>
                      {isContentViMissing && (
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                          Missing
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground h-8 leading-relaxed">
                      {contentViPreview || (
                        <span className="italic opacity-60">No content</span>
                      )}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'rounded px-1.5 py-1 border-t border-border/40 pt-1.5',
                      isContentEnMissing ? 'border border-amber-300/60 bg-amber-50/80' : '',
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/80">
                        Content EN
                      </span>
                      {isContentEnMissing && (
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                          Missing
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground h-8 leading-relaxed">
                      {contentEnPreview || (
                        <span className="italic opacity-60">No content</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-border/40 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={editingId === story.id ? 'default' : 'outline'}
                    className="flex-1 h-8 text-xs"
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
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title={
                        locale === 'vi'
                          ? 'Xem story ngoài trang public'
                          : 'View story on public site'
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {story.isVisible && !story.noIndex && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                      onClick={(e) => handlePingGoogle(story, e)}
                      disabled={isPingingId === story.id}
                      title={
                        locale === 'vi'
                          ? 'Làm mới chỉ mục SEO trên Google & IndexNow'
                          : 'Refresh SEO indexing on Google & IndexNow'
                      }
                    >
                      {isPingingId === story.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'h-8 text-xs px-3',
                      story.isVisible
                        ? 'text-neutral-600 hover:bg-neutral-100'
                        : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
                    )}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                    onClick={() => handleDelete(story.id)}
                  >
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
