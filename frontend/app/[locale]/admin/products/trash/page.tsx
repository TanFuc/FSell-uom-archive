'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { api } from '@/lib/api'
import { Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { formatPriceVND, getImageUrl, optimizeProductImage } from '@/lib/utils'
import Image from 'next/image'
import { useProducts } from '@/hooks/use-products'
import Link from 'next/link'

export default function TrashPage() {
  const locale = useLocale()
  const t = useTranslations('admin')
  const router = useRouter()
  const { toast } = useToast()
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean
    product: Product | null
  }>({ open: false, product: null })
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<{
    open: boolean
    product: Product | null
  }>({ open: false, product: null })

  // Fetch deleted products only
  const { data, isLoading, refetch } = useProducts({
    page: 1,
    limit: 100,
    includeDeleted: true,
  })

  // Filter only deleted products
  const deletedProducts = data?.data.filter(p => p.deletedAt) || []

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === deletedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(deletedProducts.map((p) => p.id))
    }
  }

  const handleRestore = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}`, { deletedAt: null })
      toast({ title: t('success'), description: t('userRestored') })
      refetch()
      setRestoreDialog({ open: false, product: null })
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToRestore'),
        variant: 'destructive',
      })
    }
  }

  const handlePermanentDelete = async (product: Product) => {
    try {
      await api.delete(`/products/${product.id}`)
      toast({ title: t('success'), description: 'Đã xóa vĩnh viễn sản phẩm' })
      refetch()
      setPermanentDeleteDialog({ open: false, product: null })
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToDelete'),
        variant: 'destructive',
      })
    }
  }

  const handleBulkRestore = async () => {
    try {
      await Promise.all(
        selectedProducts.map(id => api.patch(`/products/${id}`, { deletedAt: null }))
      )
      toast({ title: t('success'), description: `Đã khôi phục ${selectedProducts.length} sản phẩm` })
      setSelectedProducts([])
      refetch()
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Khôi phục thất bại',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            <Trash2 className="inline-block w-6 h-6 mr-2" />
            {t('trash')}
          </h1>
          <p className="text-muted-foreground">
            {deletedProducts.length} {t('inTrash')}
          </p>
        </div>
        <Link href={`/${locale}/admin/products`}>
          <Button variant="outline">
            <X className="w-4 h-4 mr-2" />
            Đóng
          </Button>
        </Link>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <span className="font-medium">
            {selectedProducts.length} {t('selected')}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
              {t('clear')}
            </Button>
            <Button variant="default" size="sm" onClick={handleBulkRestore}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Khôi phục đã chọn
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === deletedProducts.length && deletedProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-20">{t('image')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead className="w-32">{t('priceLabel')}</TableHead>
              <TableHead className="w-32">Ngày xóa</TableHead>
              <TableHead className="w-32">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-[400px]">
                  <span className="text-muted-foreground">{t('loading')}...</span>
                </TableCell>
              </TableRow>
            ) : deletedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-[400px]">
                  <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <span className="text-muted-foreground">Thùng rác trống</span>
                </TableCell>
              </TableRow>
            ) : (
              deletedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
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
                      <p className="font-medium text-muted-foreground line-clamp-2" title={product.nameVi}>{product.nameVi}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1" title={product.nameEn}>{product.nameEn}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPriceVND(product.priceVND)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {product.deletedAt ? new Date(product.deletedAt).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreDialog({ open: true, product })}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPermanentDeleteDialog({ open: true, product })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog.open} onOpenChange={(open) => setRestoreDialog({ ...restoreDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('restoreFromTrash')}</DialogTitle>
            <DialogDescription>
              Khôi phục "{restoreDialog.product?.nameVi}"? Sản phẩm sẽ được hiển thị lại trong danh sách sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog({ open: false, product: null })}>
              {t('cancel')}
            </Button>
            <Button onClick={() => restoreDialog.product && handleRestore(restoreDialog.product)}>
              {t('restore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={permanentDeleteDialog.open} onOpenChange={(open) => setPermanentDeleteDialog({ ...permanentDeleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('permanentlyDelete')}
            </DialogTitle>
            <DialogDescription>
              <strong className="text-destructive">CẢNH BÁO:</strong> Xóa vĩnh viễn "{permanentDeleteDialog.product?.nameVi}"? 
              <br />
              Hành động này KHÔNG THỂ hoàn tác!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeleteDialog({ open: false, product: null })}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => permanentDeleteDialog.product && handlePermanentDelete(permanentDeleteDialog.product)}
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
