'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, User, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { OrderTrackingTimeline } from '@/components/order/OrderTrackingTimeline'
import { api } from '@/lib/api'

export default function OrderTrackingDetailPage() {
  const params = useParams()
  const idOrNumber = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idOrNumber) return
    setLoading(true)
    api
      .getOrderTracking(idOrNumber)
      .then((data) => {
        setOrder(data)
        setError(null)
      })
      .catch((err) => {
        console.error('Lỗi tải đơn hàng:', err)
        setError('Không tìm thấy thông tin đơn hàng hoặc mã đơn không chính xác')
      })
      .finally(() => setLoading(false))
  }, [idOrNumber])

  const handleSyncTracking = async () => {
    if (!idOrNumber || syncing) return
    setSyncing(true)
    try {
      const updated = await api.syncOrderTracking(idOrNumber)
      if (updated) {
        setOrder(updated)
        if (updated.trackingNumber) {
          toast.success(`Đã cập nhật mã vận đơn từ Sapo: ${updated.trackingNumber}`)
        } else {
          toast.info('Đã kiểm tra hệ thống Sapo: Đơn hàng đang được chuẩn bị.')
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể đồng bộ vận chuyển từ Sapo lúc này')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#F9F7F1] flex flex-col items-center justify-center p-6 text-[#4A4238]">
        <div className="w-8 h-8 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#8C7E6A]">Đang tải dữ liệu đơn hàng...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] bg-[#F9F7F1] flex flex-col items-center justify-center p-6 text-center text-[#4A4238]">
        <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wider mb-2">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mb-6">
          {error || 'Vui lòng kiểm tra lại mã đơn hàng hoặc đường link tra cứu.'}
        </p>
        <Link
          href="/shop"
          className="btn text-xs tracking-[0.2em] uppercase px-6 py-2.5 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7F1] text-[#4A4238] font-sans pb-20">
      {/* Mobile-first Navigation bar */}
      <div className="sticky top-0 z-20 bg-[#F9F7F1]/95 backdrop-blur-md border-b border-[#ECE8DF] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="p-1.5 -ml-1 text-[#4A4238] hover:text-[#8C7E6A] transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div>
            <h1 className="text-xs sm:text-sm font-serif uppercase tracking-widest font-semibold">
              Chi tiết đơn hàng
            </h1>
            <p className="text-[11px] text-[#8C7E6A] font-mono tracking-tight">
              #{order.orderNumber}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium border border-[#8C7E6A]/30 text-[#8C7E6A] bg-[#8C7E6A]/10">
            {order.status === 'pending'
              ? 'Chờ xác nhận'
              : order.status === 'processing'
              ? 'Đang chuẩn bị'
              : order.status === 'shipped'
              ? 'Đang vận chuyển'
              : order.status === 'delivered'
              ? 'Đã giao'
              : 'Đã hủy'}
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        {/* Card 1: Stepper Timeline */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0EDE6]">
            <div>
              <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-serif font-semibold text-[#4A4238]">
                Hành trình đơn hàng
              </h2>
              {order.sapoOrderId && (
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Sapo Order #{order.sapoOrderNumber || order.sapoOrderId}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncTracking}
                disabled={syncing}
                title="Cập nhật trạng thái mới nhất từ Sapo (Dự phòng khi Webhook trễ)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#4A4238] bg-[#FAF8F2] hover:bg-[#F2ECE1] border border-[#ECE8DF] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-[#8C7E6A] ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Đang kiểm tra...' : 'Cập nhật Sapo'}</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8C7E6A]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đồng bộ tự động</span>
              </div>
            </div>
          </div>

          <OrderTrackingTimeline
            orderId={order.orderNumber || order.id}
            sapoOrderId={order.sapoOrderId}
            status={order.status}
            trackingNumber={order.trackingNumber}
            trackingCompany={order.trackingCompany}
            trackingUrl={order.trackingUrl}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            onSyncTracking={handleSyncTracking}
            isSyncing={syncing}
          />
        </div>

        {/* Card 2: Thông tin giao hàng */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)] space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-semibold text-[#8C7E6A]">
            Thông tin người nhận
          </h2>
          <div className="text-xs text-stone-600 space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-[#8C7E6A] shrink-0" />
              <span className="font-medium text-[#4A4238]">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-[#8C7E6A] shrink-0" />
              <span className="font-mono text-stone-700">{order.phoneNumber}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#8C7E6A] mt-0.5 shrink-0" />
              <span className="leading-relaxed">{order.shippingAddress}</span>
            </div>
            {order.note && (
              <div className="mt-2 pt-2 border-t border-[#F0EDE6] text-[11px] text-stone-500 italic">
                Ghi chú: {order.note}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Danh sách sản phẩm & Tổng tiền */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#ECE8DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)]">
          <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-semibold text-[#8C7E6A] mb-4 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sản phẩm ({order.items?.length || 0})</span>
          </h2>

          <div className="divide-y divide-[#F0EDE6]">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 bg-[#FAF8F2] border border-[#ECE8DF] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#4A4238] truncate">{item.productTitle}</p>
                    <p className="text-stone-400 text-[11px] mt-0.5">Số lượng: {item.quantity}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-[#4A4238] font-medium text-xs sm:text-sm">
                    {(item.priceVND * item.quantity).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#ECE8DF] pt-4 mt-3 flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">
              Tổng thanh toán
            </span>
            <span className="font-mono text-base sm:text-lg font-semibold text-[#8C7E6A]">
              {Number(order.totalVND).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Bottom Help Actions */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-stone-500">
            Cần thay đổi thông tin nhận hàng hoặc hỗ trợ thêm?
          </p>
          <Link
            href="/about"
            className="inline-block mt-2 text-xs uppercase tracking-[0.2em] font-medium text-[#8C7E6A] underline underline-offset-4 hover:text-[#4A4238] transition-colors"
          >
            Liên hệ hỗ trợ khách hàng
          </Link>
        </div>
      </div>
    </div>
  )
}
