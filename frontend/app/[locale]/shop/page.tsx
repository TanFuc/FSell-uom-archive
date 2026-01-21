'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useProducts } from '@/hooks/use-products'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

export default function ShopPage() {
  const locale = useLocale() as 'vi' | 'en'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    search: search || undefined,
    isActive: true, // Only show active products
  })

  return (
    <div className="container-custom spacing-lg">
      {/* Page Title */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-2xl md:text-3xl uppercase tracking-[0.2em] mb-4">
          SẢN PHẨM
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Khám phá bộ sưu tập được tuyển chọn từ các nghệ nhân Việt Nam
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-12 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="pl-12 input"
          />
        </div>
      </div>

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
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid-products stagger-children">
            {data.items.map((product) => (
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
                Previous
              </button>
              <span className="text-muted-foreground">
                {page} / {data.meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn btn-ghost disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground animate-fade-in">
          <p>Không tìm thấy sản phẩm nào.</p>
        </div>
      )}
    </div>
  )
}
}
