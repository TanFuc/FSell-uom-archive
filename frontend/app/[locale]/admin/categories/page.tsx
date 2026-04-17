'use client'

import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { type Category } from '@/lib/types'

export default function CategoriesPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  useDocumentTitle(t('categories'), 'Admin - ƯƠM. Archive')

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const data = await api.getCategories({ includeDeleted: false, includeInactive: true })

      const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0))
      setCategories(sorted)
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t('confirmDelete')} "${name}"?`)) return

    try {
      await api.deleteCategory(id)
      toast({
        title: t('success'),
        description: t('categoryDeleted'),
      })
      fetchCategories()
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToDelete'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('categories')}</h1>
          <p className="text-muted-foreground">{t('manageCategoriesDesc')}</p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/admin/categories/new`)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">{t('loading')}...</div>
        ) : categories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t('noResults')}</div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex w-full items-center gap-3 sm:gap-4">
                {/* Category Image */}
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.nameVi}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{category.nameVi}</h3>
                    {!category.isActive && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{t('inactive')}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{category.nameEn}</p>
                  {category._count && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category._count.products} {t('productsInCategory')}
                    </p>
                  )}
                </div>

                {/* Order Badge */}
                <div className="ml-auto text-sm text-muted-foreground">#{category.order || 0}</div>
              </div>

              {/* Actions */}
              <div className="flex w-full justify-end gap-2 sm:w-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/${locale}/admin/categories/${category.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleDelete(category.id, locale === 'vi' ? category.nameVi : category.nameEn)
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
