'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useCustomerStore } from '@/lib/customer-store'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { isAuthenticated, openAuthModal, setCartCount } = useCustomerStore()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  const fetchCart = async (silent = false) => {
    if (!isAuthenticated) return
    if (!silent) setLoading(true)
    try {
      const data = await api.getCart()
      setCart(data)
      const totalQty = (data?.items || []).reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0,
      )
      setCartCount(totalQty)
    } catch (err: any) {
      console.error('Lỗi khi tải giỏ hàng:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        onClose()
        openAuthModal('Vui lòng đăng nhập để xem giỏ hàng của bạn')
      } else {
        fetchCart()
      }
    }
  }, [isOpen, isAuthenticated])

  // Tự động chọn tất cả sản phẩm khi tải giỏ hàng lần đầu hoặc bảo toàn mục đang chọn
  useEffect(() => {
    if (cart?.items) {
      const validIds = new Set(cart.items.map((i: any) => i.id))
      setSelectedItemIds((prev) => {
        if (prev.length === 0) {
          return cart.items.map((i: any) => i.id)
        }
        const remaining = prev.filter((id) => validIds.has(id))
        return remaining.length > 0 ? remaining : cart.items.map((i: any) => i.id)
      })
    }
  }, [cart])

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    const items = cart?.items || []
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(items.map((i: any) => i.id))
    }
  }

  const handleUpdateQuantity = async (cartItemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    if (newQty < 1) return

    // Optimistic UI Update: Cập nhật ngay trên state để không bị nháy giỏ hàng
    const previousCart = cart
    setCart((prev: any) => {
      if (!prev?.items) return prev
      const updatedItems = prev.items.map((item: any) =>
        item.id === cartItemId ? { ...item, quantity: newQty } : item,
      )
      return { ...prev, items: updatedItems }
    })

    // Cập nhật tổng số lượng lên navbar badge ngay tức thì
    const nextTotalQty = ((cart?.items || []) as any[]).reduce(
      (sum: number, item: any) =>
        sum + (item.id === cartItemId ? newQty : item.quantity || 1),
      0,
    )
    setCartCount(nextTotalQty)

    try {
      await api.updateCartItem(cartItemId, newQty)
      // Đồng bộ ngầm không hiển thị loading spinner
      fetchCart(true)
    } catch (err) {
      // Rollback nếu có lỗi mạng
      setCart(previousCart)
      const rollbackQty = (previousCart?.items || []).reduce(
        (sum: number, item: any) => sum + (item.quantity || 1),
        0,
      )
      setCartCount(rollbackQty)
      toast.error('Không thể cập nhật số lượng')
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    const previousCart = cart
    // Optimistic UI: Xóa ngay khỏi list
    setCart((prev: any) => {
      if (!prev?.items) return prev
      return {
        ...prev,
        items: prev.items.filter((item: any) => item.id !== cartItemId),
      }
    })
    setSelectedItemIds((prev) => prev.filter((id) => id !== cartItemId))

    try {
      await api.removeCartItem(cartItemId)
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng', { duration: 1500 })
      fetchCart(true)
    } catch (err) {
      setCart(previousCart)
      toast.error('Không thể xóa sản phẩm')
    }
  }

  if (!isOpen) return null

  const items = cart?.items || []
  const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
  const selectedItems = items.filter((item: any) => selectedItemIds.includes(item.id))
  const subtotal = selectedItems.reduce(
    (sum: number, item: any) => sum + item.priceVND * item.quantity,
    0,
  )

  const checkoutHref =
    selectedItemIds.length > 0 ? `/checkout?items=${selectedItemIds.join(',')}` : '#'

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#8C7E6A] shadow-xs shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-sm uppercase tracking-[0.2em] font-bold text-[#4A4238] truncate">
                  Giỏ hàng của bạn
                </h2>
                <p className="text-[10px] text-stone-400 font-mono tracking-wider">
                  {items.length} loại sản phẩm • Tổng {totalQuantity} món
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-[#4A4238] hover:bg-stone-200/50 rounded-full transition-colors shrink-0"
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Select all bar (chỉ hiển thị khi có sản phẩm) */}
          {items.length > 0 && (
            <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-stone-700 hover:text-[#4A4238] font-medium transition-colors"
              >
                {selectedItemIds.length === items.length && items.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#8C7E6A]" />
                ) : (
                  <Square className="w-4 h-4 text-stone-400" />
                )}
                <span>Chọn tất cả ({items.length})</span>
              </button>

              <span className="text-[11px] text-[#8C7E6A] font-medium font-mono">
                Đã chọn: {selectedItemIds.length}/{items.length}
              </span>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-stone-100">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-7 h-7 text-[#8C7E6A] stroke-[1.2]" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-sm uppercase tracking-wider font-medium text-[#4A4238]">
                    Giỏ hàng chưa có sản phẩm
                  </p>
                  <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                    Hãy khám phá bộ sưu tập gốm thủ công độc bản của chúng tôi để chọn tác phẩm ưng ý.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 bg-[#4A4238] text-white hover:bg-[#8C7E6A] text-xs uppercase tracking-widest font-medium transition-all"
                >
                  Khám phá cửa hàng
                </button>
              </div>
            ) : (
              items.map((item: any) => {
                const isSelected = selectedItemIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`py-4 flex gap-3 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-55'
                    }`}
                  >
                    {/* Checkbox chọn sản phẩm */}
                    <div className="pt-5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="p-1 focus:outline-none hover:scale-105 transition-transform"
                        title={isSelected ? 'Bỏ chọn' : 'Chọn đặt hàng'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#8C7E6A]" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400" />
                        )}
                      </button>
                    </div>

                    {/* Ảnh sản phẩm */}
                    <div className="w-16 h-16 bg-white border border-stone-200 overflow-hidden shrink-0 rounded-xs">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.nameVi}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-[#4A4238] truncate" title={item.product?.nameVi}>
                          {item.product?.nameVi}
                        </h4>
                        <p className="font-mono text-xs font-semibold text-[#8C7E6A] mt-0.5">
                          {Number(item.priceVND).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>

                      {/* Nút chỉnh số lượng & Xóa */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-stone-200 bg-white rounded-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            className="p-1 text-stone-500 hover:text-[#4A4238] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs px-2 min-w-[24px] text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            className="p-1 text-stone-500 hover:text-[#4A4238] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-white space-y-4">
              <div className="flex justify-between items-baseline text-xs">
                <div className="flex flex-col">
                  <span className="uppercase tracking-wider text-stone-500 font-medium">
                    Tổng tiền tạm tính
                  </span>
                  <span className="text-[10px] text-stone-400">
                    ({selectedItemIds.length} sản phẩm được chọn)
                  </span>
                </div>
                <span className="font-mono text-base font-semibold text-[#8C7E6A]">
                  {subtotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {selectedItemIds.length > 0 ? (
                <Link
                  href={checkoutHref}
                  onClick={onClose}
                  className="w-full py-3.5 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors uppercase tracking-[0.25em] text-xs font-medium text-center shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Tiến hành đặt hàng ({selectedItemIds.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 bg-stone-300 text-stone-500 cursor-not-allowed uppercase tracking-[0.25em] text-xs font-medium text-center flex items-center justify-center gap-2"
                >
                  <span>Vui lòng chọn sản phẩm</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
