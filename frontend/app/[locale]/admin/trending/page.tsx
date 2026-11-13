'use client'

import { GripVertical, Pencil, Trash2, Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import {
  parseTrendingTerms,
  SEARCH_TRENDING_EN_KEY,
  SEARCH_TRENDING_VI_KEY,
  serializeTrendingTerms,
} from '@/lib/search-trending'

type LocaleKey = 'vi' | 'en'

const TRENDING_KEYS: Record<LocaleKey, string> = {
  vi: SEARCH_TRENDING_VI_KEY,
  en: SEARCH_TRENDING_EN_KEY,
}

export default function AdminTrendingSearchesPage() {
  const t = useTranslations('admin')
  const locale = useLocale() as LocaleKey
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [items, setItems] = useState<Record<LocaleKey, string[]>>({ vi: [], en: [] })
  const [draft, setDraft] = useState<Record<LocaleKey, string>>({ vi: '', en: '' })
  const [editingIndex, setEditingIndex] = useState<Record<LocaleKey, number | null>>({
    vi: null,
    en: null,
  })
  const [dragIndex, setDragIndex] = useState<Record<LocaleKey, number | null>>({
    vi: null,
    en: null,
  })
  const [dragOverIndex, setDragOverIndex] = useState<Record<LocaleKey, number | null>>({
    vi: null,
    en: null,
  })

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const content = await api.getSiteContent()
        setItems({
          vi: parseTrendingTerms(content[TRENDING_KEYS.vi], 'vi'),
          en: parseTrendingTerms(content[TRENDING_KEYS.en], 'en'),
        })
      } catch {
        toast({ title: t('error'), description: t('trending.loadError'), variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }

    loadTrending()
  }, [t, toast])

  const applyTerm = (lang: LocaleKey) => {
    const value = draft[lang].trim()
    if (!value) return

    setItems((prev) => {
      const current = [...prev[lang]]
      const index = editingIndex[lang]

      if (index !== null) {
        current[index] = value
      } else {
        current.unshift(value)
      }

      const deduped: string[] = []
      for (const term of current) {
        if (!deduped.some((existing) => existing.toLowerCase() === term.toLowerCase())) {
          deduped.push(term)
        }
      }

      return {
        ...prev,
        [lang]: deduped.slice(0, 12),
      }
    })

    setDraft((prev) => ({ ...prev, [lang]: '' }))
    setEditingIndex((prev) => ({ ...prev, [lang]: null }))
  }

  const removeTerm = (lang: LocaleKey, index: number) => {
    setItems((prev) => ({
      ...prev,
      [lang]: prev[lang].filter((_, idx) => idx !== index),
    }))

    if (editingIndex[lang] === index) {
      setDraft((prev) => ({ ...prev, [lang]: '' }))
      setEditingIndex((prev) => ({ ...prev, [lang]: null }))
    }
  }

  const startEdit = (lang: LocaleKey, index: number) => {
    setDraft((prev) => ({ ...prev, [lang]: items[lang][index] ?? '' }))
    setEditingIndex((prev) => ({ ...prev, [lang]: index }))
  }

  const saveAll = async () => {
    setIsSaving(true)
    try {
      await api.updateSiteContent({
        [TRENDING_KEYS.vi]: serializeTrendingTerms(items.vi),
        [TRENDING_KEYS.en]: serializeTrendingTerms(items.en),
      })
      toast({ title: t('success'), description: t('trending.saved') })
    } catch {
      toast({ title: t('error'), description: t('trending.saveError'), variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const reorderTerms = (lang: LocaleKey, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return
    }

    setItems((prev) => {
      const next = [...prev[lang]]
      if (fromIndex >= next.length || toIndex >= next.length) {
        return prev
      }

      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)

      return {
        ...prev,
        [lang]: next,
      }
    })
  }

  const renderLocaleBlock = (lang: LocaleKey) => {
    const isVi = lang === 'vi'

    return (
      <Card>
        <CardHeader>
          <CardTitle>{isVi ? t('trending.viTitle') : t('trending.enTitle')}</CardTitle>
          <CardDescription>
            {t('trending.limitHint')}{' '}
            {locale === 'vi'
              ? 'Kéo-thả để đổi thứ tự ưu tiên.'
              : 'Drag and drop to reorder priority.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={draft[lang]}
              onChange={(event) => setDraft((prev) => ({ ...prev, [lang]: event.target.value }))}
              placeholder={isVi ? t('trending.viPlaceholder') : t('trending.enPlaceholder')}
            />
            <Button type="button" onClick={() => applyTerm(lang)} className="sm:min-w-28">
              {editingIndex[lang] !== null ? t('edit') : t('create')}
            </Button>
          </div>

          <div className="rounded-xl border border-foreground/10 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('trending.preview')}
              </p>
              <p className="text-xs text-muted-foreground">{items[lang].length}/12</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {items[lang].length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('trending.empty')}</p>
              ) : (
                items[lang].map((term, index) => (
                  <div
                    key={`${lang}-${term}-${index}`}
                    draggable
                    onDragStart={() => {
                      setDragIndex((prev) => ({ ...prev, [lang]: index }))
                      setDragOverIndex((prev) => ({ ...prev, [lang]: index }))
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverIndex((prev) => ({ ...prev, [lang]: index }))
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const fromIndex = dragIndex[lang]
                      if (fromIndex !== null) {
                        reorderTerms(lang, fromIndex, index)
                      }
                      setDragIndex((prev) => ({ ...prev, [lang]: null }))
                      setDragOverIndex((prev) => ({ ...prev, [lang]: null }))
                    }}
                    onDragEnd={() => {
                      setDragIndex((prev) => ({ ...prev, [lang]: null }))
                      setDragOverIndex((prev) => ({ ...prev, [lang]: null }))
                    }}
                    className={`inline-flex cursor-grab items-center gap-1 rounded-full border px-3 py-1 active:cursor-grabbing ${
                      dragOverIndex[lang] === index
                        ? 'border-foreground/45 bg-foreground/10'
                        : 'border-foreground/15 bg-muted/20'
                    }`}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                      {term}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(lang, index)}
                      className="ml-1 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTerm(lang, index)}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <div className="py-12 text-sm text-muted-foreground">{t('loading')}...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl">
            <Sparkles className="h-5 w-5" />
            {t('trending.title')}
          </h1>
          <p className="text-muted-foreground">{t('trending.description')}</p>
        </div>

        <Button onClick={saveAll} disabled={isSaving}>
          {isSaving ? `${t('loading')}...` : t('save')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {renderLocaleBlock('vi')}
        {renderLocaleBlock('en')}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {t('trending.helper')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === 'vi'
              ? 'Các từ khóa này xuất hiện ngay trong panel search khi ô tìm kiếm còn trống.'
              : 'These terms appear in the search panel when the query input is empty.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
