'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  RotateCcw,
  Eye,
  EyeOff,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatPriceVND, getImageUrl } from '@/lib/utils'
import Image from 'next/image'

export default function ProductsPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.getAdminProducts({
        search: search || undefined,
        includeDeleted,
        limit: 100,
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast({
        title: t('error'),
        description: 'Failed to load products',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [search, includeDeleted, t, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async () => {
    if (!deleteDialog.product) return

    try {
      await api.deleteProduct(deleteDialog.product.id)
      toast({ title: t('success'), description: 'Product deleted' })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleteDialog({ open: false, product: null })
    }
  }

  const handleRestore = async (product: Product) => {
    try {
      await api.restoreProduct(product.id)
      toast({ title: t('success'), description: 'Product restored' })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to restore', variant: 'destructive' })
    }
  }

  const handleDuplicate = async (product: Product) => {
    try {
      await api.duplicateProduct(product.id)
      toast({ title: t('success'), description: 'Product duplicated' })
      fetchProducts()
    } catch (error) {
      toast({ title: t('error'), description: 'Failed to duplicate', variant: 'destructive' })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">{t('products')}</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => router.push(`/${locale}/admin/products/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

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
        <div className="flex items-center gap-2">
          <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
          <span className="text-sm">Show deleted</span>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted">
          <span className="text-sm">{selectedProducts.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
            Clear
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              // Bulk delete logic
            }}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('loading')}...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className={product.deletedAt ? 'opacity-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {product.images[0] && (
                      <Image
                        src={getImageUrl(product.images[0])}
                        alt={product.nameVi}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.nameVi}</p>
                      <p className="text-xs text-muted-foreground">{product.nameEn}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatPriceVND(product.priceVND)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {product.deletedAt ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : product.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {product.inquiryEnabled && <Badge variant="outline">Inquiry</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!product.deletedAt ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/${locale}/admin/products/${product.id}`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                              <Copy className="mr-2 h-4 w-4" />
                              {t('duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, product })}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(product)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('restore')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.product?.nameVi}"? This action can be
              undone by restoring the product.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, product: null })}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
