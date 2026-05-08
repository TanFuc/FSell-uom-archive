'use client'

import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProducts } from '@/hooks/use-products'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { type Product } from '@/lib/types'
import { formatPriceVND, getImageUrl, optimizeProductImage } from '@/lib/utils'

export default function TrashPage() {
  const locale = useLocale()
  const t = useTranslations('admin')
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

  const { data, isLoading, refetch } = useProducts({
    page: 1,
    limit: 100,
    includeDeleted: true,
  })

  const deletedProducts: Product[] = (data?.data || []).filter((p: Product) => p.deletedAt)

  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === deletedProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(deletedProducts.map((p: Product) => p.id))
    }
  }

  const handleRestore = async (product: Product) => {
    try {
      await api.restoreProduct(product.id)
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
      await api.hardDeleteProduct(product.id)
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
      await Promise.all(selectedProducts.map((id) => api.restoreProduct(id)))
      toast({
        title: t('success'),
        description: `Đã khôi phục ${selectedProducts.length} sản phẩm`,
      })
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold">
            <Trash2 className="mr-2 inline-block h-6 w-6" />
            {t('trash')}
          </h1>
          <p className="text-muted-foreground">
            {deletedProducts.length} {t('inTrash')}
          </p>
        </div>
        <Link href={`/${locale}/admin/products`}>
          <Button variant="outline">
            <X className="mr-2 h-4 w-4" />
            Đóng
          </Button>
        </Link>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <span className="font-medium">
            {selectedProducts.length} {t('selected')}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
              {t('clear')}
            </Button>
            <Button variant="default" size="sm" onClick={handleBulkRestore}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Khôi phục đã chọn
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedProducts.length === deletedProducts.length && deletedProducts.length > 0
                  }
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
                <TableCell colSpan={6} className="h-[400px] text-center">
                  <span className="text-muted-foreground">{t('loading')}...</span>
                </TableCell>
              </TableRow>
            ) : deletedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[400px] text-center">
                  <Trash2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
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
                      <p
                        className="line-clamp-2 font-medium text-muted-foreground"
                        title={product.nameVi}
                      >
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
                  <TableCell>{formatPriceVND(product.priceVND)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {product.deletedAt
                        ? new Date(product.deletedAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreDialog({ open: true, product })}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPermanentDeleteDialog({ open: true, product })}
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

      {/* Restore Dialog */}
      <Dialog
        open={restoreDialog.open}
        onOpenChange={(open) => setRestoreDialog({ ...restoreDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('restoreFromTrash')}</DialogTitle>
            <DialogDescription>
              Khôi phục "{restoreDialog.product?.nameVi}"? Sản phẩm sẽ được hiển thị lại trong danh
              sách sản phẩm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialog({ open: false, product: null })}
            >
              {t('cancel')}
            </Button>
            <Button onClick={() => restoreDialog.product && handleRestore(restoreDialog.product)}>
              {t('restore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog
        open={permanentDeleteDialog.open}
        onOpenChange={(open) => setPermanentDeleteDialog({ ...permanentDeleteDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('permanentlyDelete')}
            </DialogTitle>
            <DialogDescription>
              <strong className="text-destructive">CẢNH BÁO:</strong> Xóa vĩnh viễn "
              {permanentDeleteDialog.product?.nameVi}"?
              <br />
              Hành động này KHÔNG THỂ hoàn tác!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermanentDeleteDialog({ open: false, product: null })}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                permanentDeleteDialog.product &&
                handlePermanentDelete(permanentDeleteDialog.product)
              }
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
