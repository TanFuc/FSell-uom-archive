'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useProducts } from '@/hooks/use-products'
import { useCategories } from '@/hooks/use-categories'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ShopPage() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('shop')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get('categoryId') || undefined
  )

  // Update categoryId if URL parameter changes
  useEffect(() => {
    const catId = searchParams.get('categoryId')
    if (catId) {
      setCategoryId(catId)
    }
  }, [searchParams])

  // Update document title
  useDocumentTitle(t('title'))

  const { data: categoriesData } = useCategories({ includeInactive: false })
  const categories = categoriesData || []

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    search: search || undefined,
    categoryId: categoryId,
    isActive: true, // Only show active products
  })

  return (
    <div className="w-full px-4 md:px-12 lg:px-16 py-12 md:py-24">
      {/* Page Title */}
      <div className="text-center mb-8 md:mb-12 animate-fade-in">
        <h1 className="text-2xl md:text-3xl uppercase tracking-[0.2em] mb-4">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
          {t('subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-8 md:mb-12 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="pl-12 input text-base"
          />
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-12 animate-fade-in">
          <button
            onClick={() => {
              setCategoryId(undefined)
              setPage(1)
            }}
            className={cn(
              'px-4 md:px-6 py-2 rounded-full border text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all duration-300',
              !categoryId
                ? 'bg-[#403126] text-white border-[#403126]'
                : 'bg-transparent border-muted-foreground/20 hover:border-[#403126]'
            )}
          >
            {t('allCategories')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setCategoryId(category.id)
                setPage(1)
              }}
              className={cn(
                'px-4 md:px-6 py-2 rounded-full border text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all duration-300',
                categoryId === category.id
                  ? 'bg-[#403126] text-white border-[#403126]'
                  : 'bg-transparent border-muted-foreground/20 hover:border-[#403126]'
              )}
            >
              {locale === 'vi' ? category.nameVi : category.nameEn}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid-products">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-product bg-muted/30 animate-pulse" />
              <div className="h-4 bg-muted/30 animate-pulse w-3/4" />
              <div className="h-4 bg-muted/30 animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid-products stagger-children">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-16 animate-fade-in">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {tCommon('previous')}
              </button>
              <span className="text-muted-foreground">
                {page} / {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn btn-ghost disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {tCommon('next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground animate-fade-in">
          <p>{t('noProducts')}</p>
        </div>
      )}
    </div>
  )
}
