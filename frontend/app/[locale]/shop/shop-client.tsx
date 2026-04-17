'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { useCategories } from '@/hooks/use-categories'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useProducts } from '@/hooks/use-products'
import { cn } from '@/lib/utils'

export default function ShopClient() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('shop')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get('categoryId') || undefined,
  )

  const updateURL = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set('search', val)
      } else {
        params.delete('search')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const catId = searchParams.get('categoryId')
    const searchVal = searchParams.get('search')

    if (catId !== undefined) {
      setCategoryId(catId || undefined)
    }
    if (searchVal !== null) {
      setSearch(searchVal)
    }
  }, [searchParams])

  useDocumentTitle(t('title'))

  const { data: categoriesData } = useCategories({ includeInactive: false })
  const categories = categoriesData || []

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    search: search || undefined,
    categoryId: categoryId,
    isActive: true,
  })

  return (
    <div className="w-full bg-white pb-24">
      {/* Header padding for fixed header */}
      <div className="h-16 lg:h-20" />

      <div className="px-6 lg:px-12">
        {/* Page Header - Minimalist */}
        <div className="space-y-6 py-16 text-center md:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold uppercase tracking-[0.2em] text-foreground md:text-5xl"
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-[10px] font-medium uppercase leading-relaxed tracking-[0.2em] text-foreground/40 md:text-xs"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Search Bar - Underline Style */}
        <div className="mx-auto mb-16 max-w-2xl">
          <div className="group relative">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/20 transition-colors group-focus-within:text-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                const val = e.target.value
                setSearch(val)
                setPage(1)
                updateURL(val)
              }}
              className="w-full border-b border-foreground/10 bg-transparent py-5 pl-10 pr-10 text-xl font-bold uppercase tracking-tight text-foreground transition-all placeholder:text-foreground/10 focus:border-foreground/30 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  updateURL('')
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-foreground/20 transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs - Minimalist */}
        {categories.length > 0 && (
          <div className="mb-20 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setCategoryId(undefined)
                setPage(1)
                const params = new URLSearchParams(searchParams.toString())
                params.delete('categoryId')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              className={cn(
                'rounded-full border px-6 py-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300',
                !categoryId
                  ? 'border-foreground bg-foreground text-white'
                  : 'border-foreground/10 text-foreground/40 hover:border-foreground/30',
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
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('categoryId', category.id)
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
                }}
                className={cn(
                  'rounded-full border px-6 py-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300',
                  categoryId === category.id
                    ? 'border-foreground bg-foreground text-white'
                    : 'border-foreground/10 text-foreground/40 hover:border-foreground/30',
                )}
              >
                {locale === 'vi' ? category.nameVi : category.nameEn}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <div className="min-h-[40vh]">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-6">
                  <div className="aspect-[3/4] animate-pulse bg-muted/30" />
                  <div className="mx-auto h-4 w-3/4 animate-pulse bg-muted/30" />
                </div>
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
                  {data.data.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 4) * 0.1 }}
                    >
                      <ProductCard product={product} locale={locale} priority={idx === 0} />
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {/* Pagination - Minimalist */}
              {data.meta.totalPages > 1 && (
                <div className="mt-24 flex items-center justify-center gap-12 border-t border-foreground/5 pt-12">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={page === 1}
                    className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    <span className="transition-transform group-hover:translate-x-[-4px]">←</span>
                    {tCommon('previous')}
                  </button>
                  <span className="text-[10px] font-bold tracking-[0.4em] text-foreground/30">
                    {page} / {data.meta.totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(data.meta.totalPages, p + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={page === data.meta.totalPages}
                    className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    {tCommon('next')}
                    <span className="transition-transform group-hover:translate-x-[4px]">→</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 py-32 text-center text-foreground/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.5em]">{t('noProducts')}</p>
              <button
                onClick={() => {
                  setSearch('')
                  setCategoryId(undefined)
                  router.replace(pathname)
                }}
                className="text-[9px] font-bold uppercase tracking-[0.3em] underline decoration-foreground/10 underline-offset-8 transition-colors hover:text-foreground"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
