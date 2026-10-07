'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemsParam = searchParams.get('items')

  const [cart, setCart] = useState<any>(null)
  const [loadingCart, setLoadingCart] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    phoneNumber: '',
    shippingAddress: '',
    note: '',
  })

  // Danh sách ID sản phẩm được khách chọn từ giỏ hàng
  const selectedItemIds = useMemo(() => {
    if (!itemsParam) return null
    return itemsParam.split(',').map((s) => s.trim()).filter(Boolean)
  }, [itemsParam])

  useEffect(() => {
    // Generate or retrieve persistent guest sessionId
    let sessionId = typeof window !== 'undefined' ? localStorage.getItem('guest_session_id') : null
    if (!sessionId && typeof window !== 'undefined') {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem('guest_session_id', sessionId)
    }

    api
      .getCart(sessionId || undefined)
      .then((data) => {
        setCart(data)
      })
      .catch((err) => {
        console.error('Lỗi tải giỏ hàng:', err)
      })
      .finally(() => setLoadingCart(false))
  }, [])

  // Lọc các mặt hàng được chọn để đặt
  const itemsToCheckout = useMemo(() => {
    if (!cart?.items) return []
    if (selectedItemIds && selectedItemIds.length > 0) {
      return cart.items.filter((item: any) => selectedItemIds.includes(item.id))
    }
    return cart.items
  }, [cart?.items, selectedItemIds])

  const totalAmount = useMemo(() => {
    return itemsToCheckout.reduce(
      (sum: number, item: any) => sum + item.priceVND * item.quantity,
      0,
    )
  }, [itemsToCheckout])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || !cart.items || cart.items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống')
      return
    }

    if (itemsToCheckout.length === 0) {
      toast.error('Không có sản phẩm nào được chọn để thanh toán')
      return
    }

    if (!formData.customerEmail || !formData.customerName || !formData.phoneNumber || !formData.shippingAddress) {
      toast.error('Vui lòng điền đầy đủ các thông tin giao hàng bắt buộc')
      return
    }

    setSubmitting(true)
    try {
      const order = await api.checkoutOrder({
        cartId: cart.id,
        itemIds: selectedItemIds && selectedItemIds.length > 0 ? selectedItemIds : undefined,
        customerEmail: formData.customerEmail,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        shippingAddress: formData.shippingAddress,
        note: formData.note,
      })

      toast.success('Đặt hàng thành công!')
      // Chuyển hướng sang trang theo dõi đơn hàng
      router.push(`/order-tracking/${order.orderNumber || order.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingCart) {
    return (
      <div className="min-h-[70vh] bg-[#F9F7F1] flex flex-col items-center justify-center p-6 text-[#4A4238]">
        <div className="w-8 h-8 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#8C7E6A]">Đang chuẩn bị thông tin thanh toán...</p>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0 || itemsToCheckout.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#F9F7F1] flex flex-col items-center justify-center p-6 text-center text-[#4A4238]">
        <ShoppingBag className="w-12 h-12 text-[#8C7E6A] stroke-[1.2] mb-3 opacity-60" />
        <h2 className="font-serif text-xl uppercase tracking-wider mb-2">Không có sản phẩm để thanh toán</h2>
        <p className="text-xs text-stone-500 mb-6">Hãy chọn những tác phẩm gốm sứ yêu thích trong giỏ hàng trước khi đặt hàng.</p>
        <Link
          href="/shop"
          className="btn text-xs tracking-[0.2em] uppercase px-8 py-3 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F1] text-[#4A4238] font-sans pb-24">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-[#F9F7F1]/95 backdrop-blur-md border-b border-[#ECE8DF] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/shop" className="p-1 -ml-1 text-[#4A4238] hover:text-[#8C7E6A] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="border-l border-[#ECE8DF] pl-3">
            <h1 className="font-serif text-sm uppercase tracking-[0.25em] font-semibold text-[#4A4238]">
              Thanh toán đơn hàng
            </h1>
            <p className="text-[10px] text-stone-400">ƯƠM. Archive Minimalist Ceramic Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8C7E6A]">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Bảo mật thanh toán COD</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cột Trái: Thông tin giao nhận */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/95 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)] space-y-4">
              <h2 className="font-serif text-sm uppercase tracking-[0.2em] font-semibold text-[#4A4238] pb-3 border-b border-[#F0EDE6]">
                1. Thông tin giao nhận
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                    Họ và tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F2] border border-[#ECE8DF] focus:border-[#8C7E6A] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      placeholder="0912 345 678"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F2] border border-[#ECE8DF] focus:border-[#8C7E6A] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      required
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F2] border border-[#ECE8DF] focus:border-[#8C7E6A] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                    Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    required
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F2] border border-[#ECE8DF] focus:border-[#8C7E6A] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                    Ghi chú đơn hàng (Tùy chọn)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F2] border border-[#ECE8DF] focus:border-[#8C7E6A] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white/95 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)]">
              <h3 className="font-serif text-xs uppercase tracking-[0.2em] font-semibold text-[#8C7E6A] mb-2">
                Phương thức thanh toán
              </h3>
              <div className="flex items-center gap-3 p-3 border border-[#8C7E6A]/30 bg-[#FAF8F2] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#8C7E6A] shrink-0" />
                <div>
                  <p className="font-medium text-[#4A4238]">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-[11px] text-stone-500">Quý khách thanh toán trực tiếp cho nhân viên bưu tá khi nhận kiện hàng.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Tóm tắt đơn hàng */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/95 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)] sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE6] mb-4">
                <h2 className="font-serif text-sm uppercase tracking-[0.2em] font-semibold text-[#4A4238]">
                  Đơn hàng ({itemsToCheckout.length})
                </h2>
                {selectedItemIds && selectedItemIds.length > 0 && cart.items.length > itemsToCheckout.length && (
                  <span className="text-[10px] text-[#8C7E6A] bg-[#8C7E6A]/10 px-2 py-0.5 font-medium">
                    Chọn {itemsToCheckout.length}/{cart.items.length} món
                  </span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-[#F0EDE6] pr-1">
                {itemsToCheckout.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-[#FAF8F2] border border-[#ECE8DF] overflow-hidden shrink-0">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.nameVi}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#4A4238] truncate">{item.product?.nameVi}</p>
                        <p className="text-stone-400 text-[11px]">SL: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-mono text-stone-800 font-medium shrink-0">
                      {(item.priceVND * item.quantity).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#ECE8DF] pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Tạm tính</span>
                  <span className="font-mono text-stone-700">{totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-stone-700">Miễn phí (Tiêu chuẩn)</span>
                </div>
                <div className="border-t border-[#ECE8DF] pt-3 flex justify-between items-baseline font-medium text-sm">
                  <span className="uppercase tracking-wider font-serif">Tổng cộng</span>
                  <span className="font-mono text-lg font-semibold text-[#8C7E6A]">
                    {totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-3.5 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-400 transition-colors uppercase tracking-[0.25em] text-xs font-medium text-center shadow-sm"
              >
                {submitting ? 'Đang khởi tạo đơn hàng...' : `Xác nhận Đặt hàng (${itemsToCheckout.length})`}
              </button>

              <p className="text-[10px] text-stone-400 text-center mt-3 leading-relaxed">
                Nhấn "Xác nhận Đặt hàng" đồng nghĩa với việc bạn đồng ý với chính sách mua hàng và bảo mật của ƯƠM. Archive.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-[#F9F7F1] flex flex-col items-center justify-center p-6 text-[#4A4238]">
          <div className="w-8 h-8 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs uppercase tracking-[0.2em] text-[#8C7E6A]">Đang chuẩn bị thông tin thanh toán...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
