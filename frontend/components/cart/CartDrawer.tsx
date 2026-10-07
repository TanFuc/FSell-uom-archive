'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useCustomerStore } from '@/lib/customer-store'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { isAuthenticated, openAuthModal } = useCustomerStore()
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const data = await api.getCart()
      setCart(data)
    } catch (err: any) {
      console.error('Lỗi khi tải giỏ hàng:', err)
    } finally {
      setLoading(false)
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

  const handleUpdateQuantity = async (cartItemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    try {
      await api.updateCartItem(cartItemId, newQty)
      fetchCart()
    } catch (err) {
      toast.error('Không thể cập nhật số lượng')
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await api.removeCartItem(cartItemId)
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
      fetchCart()
    } catch (err) {
      toast.error('Không thể xóa sản phẩm')
    }
  }

  if (!isOpen) return null

  const items = cart?.items || []
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.priceVND * item.quantity,
    0,
  )

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F9F7F1] border-l border-[#ECE8DF] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE8DF] flex items-center justify-between bg-white/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#8C7E6A]" />
              <h2 className="font-serif text-sm uppercase tracking-[0.2em] font-semibold text-[#4A4238]">
                Giỏ hàng của bạn ({items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 -mr-1 text-stone-400 hover:text-[#4A4238] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#F0EDE6]">
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-10 h-10 text-stone-300 stroke-[1.2] mb-3" />
                <p className="font-serif text-xs uppercase tracking-wider text-stone-600 mb-1">
                  Giỏ hàng chưa có sản phẩm
                </p>
                <p className="text-[11px] text-stone-400">
                  Hãy khám phá bộ sưu tập gốm thủ công của chúng tôi.
                </p>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  {/* Image */}
                  <div className="w-16 h-16 bg-white border border-[#ECE8DF] overflow-hidden shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.nameVi}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                        No pic
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-[#4A4238] truncate">
                        {item.product?.nameVi}
                      </h4>
                      <p className="font-mono text-xs font-semibold text-[#8C7E6A] mt-0.5">
                        {Number(item.priceVND).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-[#D5CFC4] bg-white">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="p-1 text-stone-500 hover:text-[#4A4238] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs px-2 min-w-[24px] text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="p-1 text-stone-500 hover:text-[#4A4238] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#ECE8DF] bg-white/70 space-y-4">
              <div className="flex justify-between items-baseline text-xs">
                <span className="uppercase tracking-wider text-stone-500 font-medium">
                  Tổng tiền tạm tính
                </span>
                <span className="font-mono text-base font-semibold text-[#8C7E6A]">
                  {subtotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-3.5 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors uppercase tracking-[0.25em] text-xs font-medium text-center shadow-sm flex items-center justify-center gap-2"
              >
                <span>Tiến hành đặt hàng</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
