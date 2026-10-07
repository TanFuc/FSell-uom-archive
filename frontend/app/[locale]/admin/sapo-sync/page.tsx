'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Check,
  AlertCircle,
  Package,
  CheckSquare,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface SapoProductPreview {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  image: string | null
  isSynced: boolean
}

export default function AdminSapoSyncPage() {
  const [products, setProducts] = useState<SapoProductPreview[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingIds, setSyncingIds] = useState<number[]>([])
  const [isBatchSyncing, setIsBatchSyncing] = useState(false)
  const [filterSynced, setFilterSynced] = useState<'all' | 'synced' | 'not_synced'>('all')

  const fetchPreview = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getSapoPreview(1)
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : []
      setProducts(list)
    } catch (err: any) {
      toast.error('Không thể tải danh sách sản phẩm từ Sapo', {
        description: err?.response?.data?.message || err.message,
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    const visibleProducts = filteredProducts
    if (selectedIds.length === visibleProducts.length && visibleProducts.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(visibleProducts.map((p) => p.id))
    }
  }

  // Đồng bộ 1 sản phẩm riêng lẻ
  const handleSyncSingle = async (id: number) => {
    setSyncingIds((prev) => [...prev, id])
    try {
      const res = await api.syncSapoProducts([id])
      const item = res?.[0]
      if (item?.status === 'success') {
        toast.success(`Đã đồng bộ sản phẩm ID #${id} thành công!`)
        // Cập nhật state nội bộ
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isSynced: true } : p)),
        )
      } else {
        toast.error(`Đồng bộ thất bại: ${item?.error || 'Lỗi không xác định'}`)
      }
    } catch (err: any) {
      toast.error(`Lỗi khi gọi API đồng bộ: ${err.message}`)
    } finally {
      setSyncingIds((prev) => prev.filter((item) => item !== id))
    }
  }

  // Đồng bộ các mục đã chọn qua Checkbox
  const handleBatchSync = async () => {
    if (selectedIds.length === 0) return
    setIsBatchSyncing(true)
    try {
      const res = await api.syncSapoProducts(selectedIds)
      const successCount = res.filter((r: any) => r.status === 'success').length
      const failedCount = res.length - successCount

      if (successCount > 0) {
        toast.success(`Đã đồng bộ thành công ${successCount}/${selectedIds.length} sản phẩm`)
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} sản phẩm đồng bộ thất bại`)
      }

      // Đánh dấu đã sync cho các sản phẩm thành công
      const successIds = new Set(
        res.filter((r: any) => r.status === 'success').map((r: any) => Number(r.sapoId)),
      )
      setProducts((prev) =>
        prev.map((p) => (successIds.has(p.id) ? { ...p, isSynced: true } : p)),
      )
      setSelectedIds([])
    } catch (err: any) {
      toast.error('Có lỗi xảy ra trong quá trình đồng bộ hàng loạt')
    } finally {
      setIsBatchSyncing(false)
    }
  }

  const productList = Array.isArray(products) ? products : []

  const filteredProducts = productList.filter((p) => {
    if (filterSynced === 'synced') return p.isSynced
    if (filterSynced === 'not_synced') return !p.isSynced
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-2xl tracking-wide uppercase text-foreground">
            Đồng bộ Sản phẩm Sapo
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Đồng bộ chọn lọc sản phẩm từ phần mềm Sapo Private App sang website nội bộ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPreview}
            disabled={loading}
            className="h-9 text-xs gap-1.5 uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </Button>

          <Button
            size="sm"
            onClick={handleBatchSync}
            disabled={selectedIds.length === 0 || isBatchSyncing}
            className="h-9 text-xs gap-2 uppercase tracking-wider bg-[#8C7E6A] text-white hover:bg-[#786b59] disabled:opacity-50"
          >
            {isBatchSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Đồng bộ mục đã chọn ({selectedIds.length})</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterSynced('all')}
          className={`px-3 py-1.5 text-xs rounded transition-colors uppercase tracking-wider ${
            filterSynced === 'all'
              ? 'bg-foreground text-background font-medium'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          Tất cả ({productList.length})
        </button>
        <button
          onClick={() => setFilterSynced('not_synced')}
          className={`px-3 py-1.5 text-xs rounded transition-colors uppercase tracking-wider ${
            filterSynced === 'not_synced'
              ? 'bg-foreground text-background font-medium'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          Chưa đồng bộ ({productList.filter((p) => !p.isSynced).length})
        </button>
        <button
          onClick={() => setFilterSynced('synced')}
          className={`px-3 py-1.5 text-xs rounded transition-colors uppercase tracking-wider ${
            filterSynced === 'synced'
              ? 'bg-foreground text-background font-medium'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          Đã có trên Web ({productList.filter((p) => p.isSynced).length})
        </button>
      </div>

      {/* Main Table Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase tracking-wider font-medium">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 focus:outline-none">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#8C7E6A]" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/60" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-16">Ảnh</th>
                <th className="p-3">Tên sản phẩm</th>
                <th className="p-3 hidden sm:table-cell">SKU</th>
                <th className="p-3">Giá Sapo</th>
                <th className="p-3 hidden md:table-cell">Tồn kho</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8C7E6A]" />
                    <span>Đang kết nối Private App Sapo để lấy dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <span>Không tìm thấy sản phẩm nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  const isSyncing = syncingIds.includes(item.id)

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        isSelected ? 'bg-muted/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="p-1 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#8C7E6A]" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="w-12 h-12 rounded border border-border bg-muted/20 relative overflow-hidden flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium max-w-[200px] sm:max-w-xs truncate">
                        {item.name}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground hidden sm:table-cell">
                        {item.sku || '---'}
                      </td>
                      <td className="p-3 font-mono font-medium whitespace-nowrap">
                        {item.price.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-3 font-mono text-muted-foreground hidden md:table-cell">
                        {item.stock}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {item.isSynced ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-700 bg-emerald-50 border-emerald-200 gap-1 text-[11px] font-normal"
                          >
                            <Check className="w-3 h-3" />
                            <span>Đã có trên Web</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-amber-700 bg-amber-50 border-amber-200 gap-1 text-[11px] font-normal"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Chưa có</span>
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncSingle(item.id)}
                          disabled={isSyncing}
                          className="h-8 px-3 text-xs uppercase tracking-wider hover:bg-[#8C7E6A] hover:text-white hover:border-[#8C7E6A] transition-colors"
                        >
                          {isSyncing ? (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Syncing...
                            </span>
                          ) : (
                            'Đồng bộ'
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
