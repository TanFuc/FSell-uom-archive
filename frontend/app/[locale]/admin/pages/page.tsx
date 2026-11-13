'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { settingsKeys } from '@/hooks/use-settings'
import { api } from '@/lib/api'
import { revalidatePaths } from '@/lib/revalidate'
import {
  BUILTIN_PAGE_SLUGS,
  DEFAULT_HOME_SECTIONS,
  HOME_SECTIONS_KEY,
  SITE_PAGES_KEY,
  parseHomeSections,
  parseSitePages,
  pageHref,
  type HomeSection,
  type SitePage,
} from '@/lib/site-structure'

export default function AdminPagesPage() {
  const queryClient = useQueryClient()
  const [pages, setPages] = useState<SitePage[]>([])
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [persistedSlugs, setPersistedSlugs] = useState<string[]>([])

  useEffect(() => {
    api
      .getSiteContent()
      .then((content) => {
        const loadedPages = parseSitePages(content)
        setPages(loadedPages)
        setPersistedSlugs(loadedPages.map((page) => page.slug))
        setSections(parseHomeSections(content))
      })
      .catch(() => setMessage('Không thể tải cấu hình trang.'))
      .finally(() => setLoading(false))
  }, [])

  const updatePage = (slug: string, patch: Partial<SitePage>) =>
    setPages((current) =>
      current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)),
    )
  const updateSection = (key: string, patch: Partial<HomeSection>) =>
    setSections((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    )

  const addPage = () => {
    let number = 1
    while (pages.some((item) => item.slug === `trang-moi-${number}`)) number++
    setPages((current) => [
      ...current,
      {
        slug: `trang-moi-${number}`,
        titleVi: 'Trang mới',
        titleEn: 'New page',
        descriptionVi: '',
        descriptionEn: '',
        contentVi: '',
        contentEn: '',
        isVisible: false,
      },
    ])
  }

  const addSection = () =>
    setSections((current) => [
      ...current,
      {
        key: `custom-${crypto.randomUUID()}`,
        titleVi: 'Mục mới',
        titleEn: 'New section',
        subtitleVi: '',
        subtitleEn: '',
        isVisible: false,
      },
    ])

  const save = async () => {
    setMessage('')
    if (
      new Set(pages.map((item) => item.slug)).size !== pages.length ||
      pages.some(
        (item) =>
          !/^[a-z0-9-]{1,60}$/.test(item.slug) || !item.titleVi.trim() || !item.titleEn.trim(),
      )
    ) {
      setMessage(
        'Đường dẫn trang phải duy nhất, chỉ gồm chữ thường, số và dấu gạch ngang; tiêu đề không được trống.',
      )
      return
    }
    setSaving(true)
    try {
      await api.updateSiteContent({
        [SITE_PAGES_KEY]: JSON.stringify(pages),
        [HOME_SECTIONS_KEY]: JSON.stringify(sections),
      })
      await queryClient.invalidateQueries({ queryKey: settingsKeys.content() })
      void revalidatePaths([
        '/vi',
        '/en',
        '/vi/shop',
        '/en/shop',
        '/vi/journal',
        '/en/journal',
        '/vi/about',
        '/en/about',
        '/sitemap.xml',
        ...Array.from(new Set([...persistedSlugs, ...pages.map((page) => page.slug)]))
          .filter((slug) => !BUILTIN_PAGE_SLUGS.includes(slug as (typeof BUILTIN_PAGE_SLUGS)[number]))
          .flatMap((slug) => [`/vi/pages/${slug}`, `/en/pages/${slug}`]),
      ])
      setPersistedSlugs(pages.map((page) => page.slug))
      setMessage('Đã lưu pages và sections.')
    } catch {
      setMessage('Không thể lưu cấu hình.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-sm">Đang tải pages và sections...</div>

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="font-serif text-2xl text-[#4A4238]">Pages & Sections</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quản lý nội dung và trạng thái hiển thị trên website, header, footer.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
      {message && (
        <p role="status" className="rounded border border-neutral-200 bg-white p-3 text-sm">
          {message}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl">Các trang</h2>
          <Button type="button" variant="outline" onClick={addPage}>
            Thêm trang
          </Button>
        </div>
        {pages.map((page) => {
          const builtIn = BUILTIN_PAGE_SLUGS.includes(
            page.slug as (typeof BUILTIN_PAGE_SLUGS)[number],
          )
          return (
            <div
              key={builtIn ? page.slug : `custom-${pages.indexOf(page)}`}
              className="space-y-4 rounded border border-neutral-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{page.titleVi}</h3>
                  <p className="text-xs text-neutral-500">{pageHref('vi', page.slug)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={page.isVisible}
                      onChange={(event) =>
                        updatePage(page.slug, { isVisible: event.target.checked })
                      }
                    />{' '}
                    Hiển thị
                  </label>
                  {!builtIn && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPages((current) => current.filter((item) => item.slug !== page.slug))
                      }
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
              {!builtIn && (
                <label className="block text-xs">
                  Đường dẫn
                  <Input
                    value={page.slug}
                    onChange={(event) =>
                      updatePage(page.slug, { slug: event.target.value.toLowerCase() })
                    }
                  />
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs">
                  Tiêu đề VI
                  <Input
                    value={page.titleVi}
                    onChange={(event) => updatePage(page.slug, { titleVi: event.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Title EN
                  <Input
                    value={page.titleEn}
                    onChange={(event) => updatePage(page.slug, { titleEn: event.target.value })}
                  />
                </label>
                <label className="text-xs">
                  Mô tả VI
                  <Input
                    value={page.descriptionVi}
                    onChange={(event) =>
                      updatePage(page.slug, { descriptionVi: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs">
                  Description EN
                  <Input
                    value={page.descriptionEn}
                    onChange={(event) =>
                      updatePage(page.slug, { descriptionEn: event.target.value })
                    }
                  />
                </label>
              </div>
              {!builtIn && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs">
                    Nội dung VI
                    <Textarea
                      rows={5}
                      value={page.contentVi}
                      onChange={(event) => updatePage(page.slug, { contentVi: event.target.value })}
                    />
                  </label>
                  <label className="text-xs">
                    Content EN
                    <Textarea
                      rows={5}
                      value={page.contentEn}
                      onChange={(event) => updatePage(page.slug, { contentEn: event.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl">Sections trang chủ</h2>
          <Button type="button" variant="outline" onClick={addSection}>
            Thêm section
          </Button>
        </div>
        {sections.map((section) => (
          <div
            key={section.key}
            className="space-y-3 rounded border border-neutral-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">
                {section.key.replace('custom-', 'Section ')}
              </h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={section.isVisible}
                    onChange={(event) =>
                      updateSection(section.key, { isVisible: event.target.checked })
                    }
                  />{' '}
                  Hiển thị
                </label>
                {!DEFAULT_HOME_SECTIONS.some((item) => item.key === section.key) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSections((current) => current.filter((item) => item.key !== section.key))
                    }
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs">
                Nhãn VI
                <Input
                  value={section.titleVi}
                  onChange={(event) => updateSection(section.key, { titleVi: event.target.value })}
                />
              </label>
              <label className="text-xs">
                Label EN
                <Input
                  value={section.titleEn}
                  onChange={(event) => updateSection(section.key, { titleEn: event.target.value })}
                />
              </label>
              <label className="text-xs">
                Tiêu đề VI
                <Input
                  value={section.subtitleVi}
                  onChange={(event) =>
                    updateSection(section.key, { subtitleVi: event.target.value })
                  }
                />
              </label>
              <label className="text-xs">
                Title EN
                <Input
                  value={section.subtitleEn}
                  onChange={(event) =>
                    updateSection(section.key, { subtitleEn: event.target.value })
                  }
                />
              </label>
              <label className="text-xs">
                Nội dung VI
                <Textarea
                  rows={3}
                      value={section.bodyVi ?? ''}
                  onChange={(event) => updateSection(section.key, { bodyVi: event.target.value })}
                />
              </label>
              <label className="text-xs">
                Content EN
                <Textarea
                  rows={3}
                      value={section.bodyEn ?? ''}
                  onChange={(event) => updateSection(section.key, { bodyEn: event.target.value })}
                />
              </label>
            </div>
          </div>
        ))}
      </section>
      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  )
}
