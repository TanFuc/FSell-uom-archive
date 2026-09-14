'use client'

import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Power,
  PowerOff,
  Trash,
  ExternalLink,
  Zap,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { revalidatePaths } from '@/lib/revalidate'
import { pingProductSeo } from '@/lib/seo-ping'
import { type Product } from '@/lib/types'
import { formatPriceVND, getImageUrl, optimizeProductImage, cn } from '@/lib/utils'

function formatUsdValue(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return `$${value.toFixed(2)}`
}

export default function ProductsPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  useDocumentTitle(t('products'), 'Admin - ƯƠM. Archive')

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPinging, setIsPinging] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyProductIds, setBusyProductIds] = useState<Set<string>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  const searchRef = useRef(search)
  searchRef.current = search

  const fetchProducts = useCallback(
    async (options?: { withLoading?: boolean; query?: string }) => {
      const withLoading = options?.withLoading ?? false
      const query = options?.query !== undefined ? options.query : searchRef.current

      try {
        if (withLoading) {
          setIsLoading(true)
        } else {
          setIsRefreshing(true)
        }

        const response = await api.getAdminProducts({
          search: query || undefined,
          includeDeleted: false,
          limit: 100,
        })
        setProducts(response.data.filter((p: Product) => !p.deletedAt))
      } catch (error) {
        console.error('Failed to fetch products:', error)
        toast({
          title: t('error'),
          description: t('failedToUpdate'),
          variant: 'destructive',
        })
      } finally {
        if (withLoading) {
          setIsLoading(false)
        }
        setIsRefreshing(false)
      }
    },
    [t, toast],
  )

  useEffect(() => {
    fetchProducts({ withLoading: true, query: '' })
  }, [fetchProducts])

  const isInitialSearch = useRef(true)
  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false
      return
    }
    const delayDebounce = setTimeout(() => {
      fetchProducts({ withLoading: false, query: search })
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [search, fetchProducts])

  const handleDelete = async () => {
    if (!deleteDialog.product) return

    const productToDelete = deleteDialog.product

    try {
      await api.deleteProduct(productToDelete.id)
      setProducts((prev) => prev.filter((item) => item.id !== productToDelete.id))
      setSelectedProducts((prev) => prev.filter((id) => id !== productToDelete.id))
      toast({ title: t('success'), description: 'Đã chuyển vào thùng rác' })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToDelete'), variant: 'destructive' })
    } finally {
      setDeleteDialog({ open: false, product: null })
    }
  }

  const handleDuplicate = async (product: Product) => {
    try {
      const duplicated = await api.duplicateProduct(product.id)
      toast({ title: t('success'), description: t('productDuplicated') })
      setProducts((prev) => [duplicated, ...prev])
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    }
  }

  const handleToggleActive = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    if (busyProductIds.has(product.id)) return

    const nextValue = !product.isActive
    setBusyProductIds((prev) => new Set(prev).add(product.id))
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, isActive: nextValue } : item)),
    )

    try {
      await api.updateProduct(product.id, { isActive: nextValue })
      toast({
        title: t('success'),
        description: nextValue ? 'Đã bật sản phẩm' : 'Đã tắt sản phẩm',
      })
    } catch (error) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isActive: product.isActive } : item,
        ),
      )
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    } finally {
      setBusyProductIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }

  const handleToggleFeatured = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    if (busyProductIds.has(product.id)) return

    const nextValue = !product.isFeatured
    setBusyProductIds((prev) => new Set(prev).add(product.id))
    setProducts((prev) =>
      prev.map((item) => (item.id === product.id ? { ...item, isFeatured: nextValue } : item)),
    )

    try {
      await api.updateProduct(product.id, { isFeatured: nextValue })
      toast({
        title: t('success'),
        description: nextValue ? 'Đã đặt nổi bật' : 'Đã bỏ khỏi nổi bật',
      })
    } catch (error) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, isFeatured: product.isFeatured } : item,
        ),
      )
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    } finally {
      setBusyProductIds((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }

  const handleBulkDelete = async () => {
    const idsToDelete = [...selectedProducts]

    try {
      await Promise.all(idsToDelete.map((id) => api.deleteProduct(id)))
      setProducts((prev) => prev.filter((item) => !idsToDelete.includes(item.id)))
      toast({
        title: t('success'),
        description: `Đã chuyển ${idsToDelete.length} sản phẩm vào thùng rác`,
      })
      setSelectedProducts([])
      fetchProducts({ withLoading: false })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToDelete'), variant: 'destructive' })
    }
  }

  const handleBulkToggleActive = async (active: boolean) => {
    const idsToUpdate = [...selectedProducts]

    setProducts((prev) =>
      prev.map((item) => (idsToUpdate.includes(item.id) ? { ...item, isActive: active } : item)),
    )

    try {
      await Promise.all(idsToUpdate.map((id) => api.updateProduct(id, { isActive: active })))
      toast({
        title: t('success'),
        description: `Đã ${active ? 'bật' : 'tắt'} ${idsToUpdate.length} sản phẩm`,
      })
      setSelectedProducts([])
      fetchProducts({ withLoading: false })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
      fetchProducts({ withLoading: false })
    }
  }

  const handleBulkToggleFeatured = async (featured: boolean) => {
    const idsToUpdate = [...selectedProducts]

    setProducts((prev) =>
      prev.map((item) =>
        idsToUpdate.includes(item.id) ? { ...item, isFeatured: featured } : item,
      ),
    )

    try {
      await Promise.all(idsToUpdate.map((id) => api.updateProduct(id, { isFeatured: featured })))
      toast({
        title: t('success'),
        description: `Đã ${featured ? 'đặt nổi bật' : 'bỏ nổi bật'} ${idsToUpdate.length} sản phẩm`,
      })
      setSelectedProducts([])
      fetchProducts({ withLoading: false })
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
      fetchProducts({ withLoading: false })
    }
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const handlePingGoogle = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPinging(product.id)

    try {
      const pathsToRevalidate = [
        `/vi/shop/${product.slug}`,
        `/en/shop/${product.slug}`,
        '/vi/shop',
        '/en/shop',
        '/sitemap.xml',
      ]

      const [revalResult] = await Promise.all([
        revalidatePaths(pathsToRevalidate),
        pingProductSeo(product.slug),
      ])

      if (revalResult.success) {
        toast({
          title: 'SEO Refresh Thành công',
          description: 'Đã xóa cache & gửi yêu cầu làm mới chỉ mục (IndexNow & Googlebot)',
        })
      } else {
        throw new Error(revalResult.message || 'Làm mới cache thất bại')
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi SEO Refresh',
        description: error?.message || 'Không thể làm mới chỉ mục ngay lúc này',
        variant: 'destructive',
      })
    } finally {
      setIsPinging(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl">{t('products')}</h1>
          <p className="text-muted-foreground">{t('manageProductCatalog')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/${locale}/admin/products/trash`}>
              <Trash className="mr-2 h-4 w-4" />
              {t('trash')}
            </Link>
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/admin/products/new`)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isRefreshing && <span className="text-xs text-muted-foreground">{t('loading')}...</span>}
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
          <span className="block text-sm font-medium">
            {selectedProducts.length} {t('selected')}
          </span>
          <div className="relative">
            <div className="hide-scrollbar -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start"
                onClick={() => setSelectedProducts([])}
              >
                {t('clear')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start"
                onClick={() => handleBulkToggleActive(true)}
              >
                <Power className="mr-2 h-4 w-4" />
                Bật
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start"
                onClick={() => handleBulkToggleActive(false)}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Tắt
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start"
                onClick={() => handleBulkToggleFeatured(true)}
              >
                <Star className="mr-2 h-4 w-4" />
                Nổi bật
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start"
                onClick={() => handleBulkToggleFeatured(false)}
              >
                <StarOff className="mr-2 h-4 w-4" />
                Bỏ nổi bật
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 snap-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteSelected')}
              </Button>
            </div>

            {/* Mobile hint: faded edges to indicate horizontal scroll */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-primary/20 to-transparent md:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-primary/20 to-transparent md:hidden" />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-background">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">{t('image')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead className="w-32">{t('category')}</TableHead>
              <TableHead className="w-32">{t('priceLabel')}</TableHead>
              <TableHead className="w-32">USD</TableHead>
              <TableHead className="w-24">{t('stockLabel')}</TableHead>
              <TableHead className="w-24 text-center">Link</TableHead>
              <TableHead className="w-32 text-center">{t('activeStatus')}</TableHead>
              <TableHead className="w-32 text-center">{t('featuredStatus')}</TableHead>
              <TableHead className="w-20 text-center">SEO</TableHead>
              <TableHead className="w-32">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="h-[400px] text-center">
                  <span className="text-muted-foreground">{t('loading')}...</span>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-[400px] text-center">
                  <span className="text-muted-foreground">{t('noResults')}</span>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => router.push(`/${locale}/admin/products/${product.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.images[0] && (
                      <div
                        className="relative overflow-hidden rounded bg-muted/20"
                        style={{ width: '48px', height: '60px' }}
                      >
                        <Image
                          src={optimizeProductImage(getImageUrl(product.images[0]), {
                            width: 100,
                            height: 125,
                          })}
                          alt={product.nameVi}
                          fill
                          sizes="48px"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="line-clamp-2 font-medium" title={product.nameVi}>
                        {product.nameVi}
                      </p>
                      <p
                        className="line-clamp-1 text-xs text-muted-foreground"
                        title={product.nameEn}
                      >
                        {product.nameEn}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <span className="text-sm">
                        {locale === 'vi' ? product.category.nameVi : product.category.nameEn}
                      </span>
                    ) : (
                      <span className="text-sm italic text-muted-foreground">
                        {t('noCategory')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatPriceVND(product.priceVND)}</TableCell>
                  <TableCell>{formatUsdValue(product.priceUSD)}</TableCell>
                  <TableCell>
                    <span className={product.stock <= 0 ? 'font-medium text-destructive' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    {product.isActive ? (
                      <a
                        href={`/${locale}/shop/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Xem sản phẩm ngoài trang public"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleToggleActive(product, e)}
                      className={cn(
                        'whitespace-nowrap transition-colors text-xs font-medium',
                        product.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200/80 hover:text-neutral-700',
                      )}
                    >
                      {product.isActive ? (
                        <>
                          <Power className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Bật
                        </>
                      ) : (
                        <>
                          <PowerOff className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                          Tắt
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleToggleFeatured(product, e)}
                      className={cn(
                        'whitespace-nowrap transition-colors text-xs font-medium',
                        product.isFeatured
                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200/80 hover:text-neutral-700',
                      )}
                    >
                      {product.isFeatured ? (
                        <>
                          <Star className="mr-1.5 h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                          Nổi bật
                        </>
                      ) : (
                        <>
                          <StarOff className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                          Thường
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => handlePingGoogle(product, e)}
                      disabled={isPinging === product.id}
                      className={cn(
                        'h-8 w-8',
                        isPinging === product.id && 'cursor-not-allowed opacity-70',
                      )}
                      title="Làm mới chỉ mục SEO trên Google"
                    >
                      {isPinging === product.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 text-amber-500" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${locale}/admin/products/${product.id}`)}
                        title="Chỉnh sửa"
                        className="hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(product)}
                        title="Nhân bản"
                        className="hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, product })}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, product: null })}
      >
        <DialogContent className="p-6 sm:max-w-[425px]">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4A4238]/10 text-[#4A4238] dark:bg-[#4A4238]/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl">Xóa sản phẩm?</DialogTitle>
              <DialogDescription className="mx-auto max-w-[90%] text-center">
                Bạn có chắc chắn muốn xóa sản phẩm{' '}
                <span className="font-semibold text-foreground">
                  "{deleteDialog.product?.nameVi}"
                </span>{' '}
                không?
                <br />
                <span className="mt-2 block text-sm text-muted-foreground">
                  Sản phẩm sẽ được chuyển vào thùng rác và có thể khôi phục tại mục Thùng rác.
                </span>
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:justify-center sm:space-x-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, product: null })}
              className="w-full sm:w-32"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full bg-[#4A4238] text-white hover:bg-[#4A4238]/90 sm:w-32"
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
