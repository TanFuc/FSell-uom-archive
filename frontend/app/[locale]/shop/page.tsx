'use client'

import { Search, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { useCategories } from '@/hooks/use-categories'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProducts } from '@/hooks/use-products'
import { cn } from '@/lib/utils'

export default function ShopPage() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('shop')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get('categoryId') || undefined,
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
    <div className="w-full px-4 py-12 md:px-12 md:py-24 lg:px-16">
      {/* Page Title */}
      <div className="animate-fade-in mb-8 text-center md:mb-12">
        <h1 className="mb-4 text-2xl uppercase tracking-[0.2em] md:text-3xl">{t('title')}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {t('subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="animate-slide-up mx-auto mb-8 max-w-md md:mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="input pl-12 text-base"
          />
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="animate-fade-in mb-8 flex flex-wrap justify-center gap-2 md:mb-12 md:gap-4">
          <button
            onClick={() => {
              setCategoryId(undefined)
              setPage(1)
            }}
            className={cn(
              'rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:px-6 md:text-xs md:tracking-[0.2em]',
              !categoryId
                ? 'border-[#403126] bg-[#403126] text-white'
                : 'border-muted-foreground/20 bg-transparent hover:border-[#403126]',
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
                'rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.15em] transition-all duration-300 md:px-6 md:text-xs md:tracking-[0.2em]',
                categoryId === category.id
                  ? 'border-[#403126] bg-[#403126] text-white'
                  : 'border-muted-foreground/20 bg-transparent hover:border-[#403126]',
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
              <div className="aspect-product animate-pulse bg-muted/30" />
              <div className="h-4 w-3/4 animate-pulse bg-muted/30" />
              <div className="h-4 w-1/2 animate-pulse bg-muted/30" />
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
            <div className="animate-fade-in mt-16 flex items-center justify-center gap-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-30"
              >
                {tCommon('previous')}
              </button>
              <span className="text-muted-foreground">
                {page} / {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn btn-ghost uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-30"
              >
                {tCommon('next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="animate-fade-in py-16 text-center text-muted-foreground">
          <p>{t('noProducts')}</p>
        </div>
      )}
    </div>
  )
}
