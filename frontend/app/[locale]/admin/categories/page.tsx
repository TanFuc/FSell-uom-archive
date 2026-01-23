'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Category } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useDocumentTitle } from '@/hooks/use-document-title'

export default function CategoriesPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()
  
  useDocumentTitle(t('categories'), 'Admin - Ươm Archive')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const data = await api.getCategories({ includeDeleted: false, includeInactive: true })
      // Sort by order
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
        description: t('categoryDeleted') 
      })
      fetchCategories()
    } catch (error) {
      toast({ 
        title: t('error'), 
        description: t('failedToDelete'), 
        variant: 'destructive' 
      })
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">{t('categories')}</h1>
          <p className="text-muted-foreground">{t('manageCategoriesDesc')}</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/admin/categories/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>
      
      {/* Categories List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('loading')}...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('noResults')}
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {/* Category Image */}
              <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.nameVi}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{category.nameVi}</h3>
                  {!category.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">
                      {t('inactive')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {category.nameEn}
                </p>
                {category._count && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {category._count.products} {t('productsInCategory')}
                  </p>
                )}
              </div>
              
              {/* Order Badge */}
              <div className="text-sm text-muted-foreground">
                #{category.order || 0}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
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
                  onClick={() => handleDelete(category.id, locale === 'vi' ? category.nameVi : category.nameEn)}
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
