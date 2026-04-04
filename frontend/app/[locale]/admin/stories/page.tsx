'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { parseStories, serializeStories, STORIES_CONTENT_KEY, type StoryItem } from '@/lib/stories'

const EMPTY_STORY: Omit<StoryItem, 'id'> = {
  titleVi: '',
  titleEn: '',
  summaryVi: '',
  summaryEn: '',
  imageUrl: '',
  publishedAt: '',
}

export default function AdminStoriesPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const { toast } = useToast()

  const [stories, setStories] = useState<StoryItem[]>([])
  const [draft, setDraft] = useState(EMPTY_STORY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  const resetDraft = () => {
    setDraft(EMPTY_STORY)
    setEditingId(null)
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
      toast({ title: t('error'), description: t('stories.imageUploadError'), variant: 'destructive' })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleEdit = (story: StoryItem) => {
    setEditingId(story.id)
    setDraft({
      titleVi: story.titleVi,
      titleEn: story.titleEn,
      summaryVi: story.summaryVi,
      summaryEn: story.summaryEn,
      imageUrl: story.imageUrl,
      publishedAt: story.publishedAt || '',
    })
  }

  const handleUpsert = () => {
    if (
      !draft.titleVi.trim() ||
      !draft.titleEn.trim() ||
      !draft.summaryVi.trim() ||
      !draft.summaryEn.trim() ||
      !draft.imageUrl.trim()
    ) {
      toast({ title: t('error'), description: t('stories.requiredFields'), variant: 'destructive' })
      return
    }

    if (editingId) {
      setStories((prev) =>
        prev.map((story) =>
          story.id === editingId
            ? {
                ...story,
                ...draft,
                publishedAt: draft.publishedAt?.trim() || undefined,
              }
            : story,
        ),
      )
    } else {
      setStories((prev) => [
        {
          id: crypto.randomUUID(),
          ...draft,
          publishedAt: draft.publishedAt?.trim() || undefined,
        },
        ...prev,
      ])
    }

    resetDraft()
  }

  const handleDelete = (id: string) => {
    setStories((prev) => prev.filter((story) => story.id !== id))
    if (editingId === id) resetDraft()
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.updateSiteContent({
        [STORIES_CONTENT_KEY]: serializeStories(stories),
      })
      toast({ title: t('success'), description: t('stories.saved') })
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('stories.title')}</h1>
          <p className="text-muted-foreground">{t('stories.description')}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? `${t('loading')}...` : t('stories.saveAll')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingStory ? t('stories.editStory') : t('stories.addStory')}</CardTitle>
          <CardDescription>{t('stories.formHint')}</CardDescription>
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUpsert}>{editingStory ? t('stories.updateStory') : t('stories.addStory')}</Button>
            {editingStory && (
              <Button variant="outline" onClick={resetDraft}>
                {t('cancel')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stories.map((story) => (
          <Card key={story.id}>
            <CardContent className="space-y-3 p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                <Image src={story.imageUrl} alt={story.titleEn} fill className="object-cover" unoptimized />
              </div>
              <h3 className="font-semibold">{locale === 'vi' ? story.titleVi : story.titleEn}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {locale === 'vi' ? story.summaryVi : story.summaryEn}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(story)}>
                  {t('edit')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(story.id)}>
                  {t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}