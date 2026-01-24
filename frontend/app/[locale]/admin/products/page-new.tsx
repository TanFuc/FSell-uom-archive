'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { formatPriceVND, getImageUrl, optimizeProductImage, slugify } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default function ProductsPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.getAdminProducts({
        search: search || undefined,
        includeDeleted: false,  // Don't show deleted products
        limit: 100,
      })
      setProducts(response.data.filter((p: Product) => !p.deletedAt))  // Extra filter
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast({
        title: t('error'),
        description: t('failedToUpdate'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [search, t, toast])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [search])

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async () => {
    if (!deleteDialog.product) return

    try {
      await api.deleteProduct(deleteDialog.product.id)
      toast({ title: t('success'), description: 'Đã xóa thành công' })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToDelete'), variant: 'destructive' })
    } finally {
      setDeleteDialog({ open: false, product: null })
    }
  }

  const handleDuplicate = async (product: Product) => {
    try {
      await api.duplicateProduct(product.id)
      toast({ title: t('success'), description: t('productDuplicated') })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    }
  }

  // Quick toggle for active status
  const handleToggleActive = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.updateProduct(product.id, { isActive: !product.isActive })
      toast({ 
        title: t('success'), 
        description: product.isActive ? 'Đã tắt sản phẩm' : 'Đã bật sản phẩm' 
      })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    }
  }

  // Quick toggle for featured status
  const handleToggleFeatured = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.updateProduct(product.id, { isFeatured: !product.isFeatured })
      toast({ 
        title: t('success'), 
        description: product.isFeatured ? 'Đã bỏ khỏi nổi bật' : 'Đã đặt nổi bật' 
      })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    }
  }

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map(id => api.deleteProduct(id)))
      toast({ title: t('success'), description: `Đã chuyển ${selectedProducts.length} sản phẩm vào thùng rác` })
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToDelete'), variant: 'destructive' })
    }
  }

  const handleBulkToggleActive = async (active: boolean) => {
    try {
      await Promise.all(selectedProducts.map(id => api.updateProduct(id, { isActive: active })))
      toast({ title: t('success'), description: `Đã ${active ? 'bật' : 'tắt'} ${selectedProducts.length} sản phẩm` })
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
    }
  }

  const handleBulkToggleFeatured = async (featured: boolean) => {
    try {
      await Promise.all(selectedProducts.map(id => api.updateProduct(id, { isFeatured: featured })))
      toast({ title: t('success'), description: `Đã ${featured ? 'đặt nổi bật' : 'bỏ nổi bật'} ${selectedProducts.length} sản phẩm` })
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: t('failedToUpdate'), variant: 'destructive' })
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
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">{t('products')}</h1>
          <p className="text-muted-foreground">{t('manageProductCatalog')}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/admin/products/trash`}>
            <Button variant="outline">
              <Trash className="mr-2 h-4 w-4" />
              {t('trash')}
            </Button>
          </Link>
          <Button onClick={() => router.push(`/${locale}/admin/products/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selectedProducts.length} {t('selected')}</span>
          <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
            {t('clear')}
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(true)}>
            <Power className="w-4 h-4 mr-2" />
            Bật
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(false)}>
            <PowerOff className="w-4 h-4 mr-2" />
            Tắt
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleFeatured(true)}>
            <Star className="w-4 h-4 mr-2" />
            Nổi bật
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleFeatured(false)}>
            <StarOff className="w-4 h-4 mr-2" />
            Bỏ nổi bật
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('deleteSelected')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
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
              <TableHead className="w-32">{t('priceLabel')}</TableHead>
              <TableHead className="w-24">{t('stockLabel')}</TableHead>
              <TableHead className="w-32 text-center">{t('activeStatus')}</TableHead>
              <TableHead className="w-32 text-center">{t('featuredStatus')}</TableHead>
              <TableHead className="w-32">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-[400px]">
                  <span className="text-muted-foreground">{t('loading')}...</span>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-[400px]">
                  <span className="text-muted-foreground">{t('noResults')}</span>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow 
                  key={product.id} 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
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
                      <div className="relative rounded overflow-hidden bg-muted/20" style={{ width: '48px', height: '60px' }}>
                        <Image
                          src={optimizeProductImage(getImageUrl(product.images[0]), { width: 100, height: 125 })}
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
                      <p className="font-medium">{product.nameVi}</p>
                      <p className="text-xs text-muted-foreground">{product.nameEn}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPriceVND(product.priceVND)}</TableCell>
                  <TableCell>
                    <span className={product.stock <= 0 ? 'text-destructive font-medium' : ''}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Button
                      variant={product.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => handleToggleActive(product, e)}
                      className={product.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {product.isActive ? (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Bật
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Tắt
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                    <Button
                      variant={product.isFeatured ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => handleToggleFeatured(product, e)}
                      className={product.isFeatured ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                    >
                      {product.isFeatured ? (
                        <>
                          <Star className="w-4 h-4 mr-1 fill-current" />
                          Nổi bật
                        </>
                      ) : (
                        <>
                          <StarOff className="w-4 h-4 mr-1" />
                          Thường
                        </>
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(product)}
                        title="Nhân bản"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, product })}
                        className="text-destructive hover:text-destructive"
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogDescription>
              Chuyển "{deleteDialog.product?.nameVi}" vào thùng rác? Bạn có thể khôi phục sản phẩm sau này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, product: null })}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Chuyển vào thùng rác
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
