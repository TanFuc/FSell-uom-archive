'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  QrCode,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { OrderTrackingTimeline } from '@/components/order/OrderTrackingTimeline'
import { PaymentTransferModal } from '@/components/order/PaymentTransferModal'
import { api } from '@/lib/api'

export default function OrderTrackingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const idOrNumber = params?.id as string
  const paymentAccessToken = searchParams.get('access') || undefined

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [viewProofModalOpen, setViewProofModalOpen] = useState(false)

  useEffect(() => {
    if (!idOrNumber) return
    setLoading(true)
    api
      .getOrderTracking(idOrNumber, paymentAccessToken)
      .then((data) => {
        setOrder(data)
        setError(null)
      })
      .catch((err) => {
        console.error('Lỗi tải đơn hàng:', err)
        setError('Không tìm thấy đơn hàng hoặc liên kết truy cập không hợp lệ. Hãy mở đơn từ email xác nhận hoặc mục Đơn của tôi.')
      })
      .finally(() => setLoading(false))

    api
      .getPaymentSettings()
      .then(setPaymentSettings)
      .catch(() => {})
  }, [idOrNumber, paymentAccessToken])

  const handleSyncTracking = async () => {
    if (!idOrNumber || syncing) return
    setSyncing(true)
    try {
      const updated = await api.syncOrderTracking(idOrNumber, paymentAccessToken)
      if (updated) {
        setOrder(updated)
        if (updated.trackingNumber) {
          toast.success(`Đã cập nhật mã vận đơn: ${updated.trackingNumber}`)
        } else {
          toast.info('Kiểm tra hành trình: Đơn hàng đang được đóng gói chuẩn bị.')
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật hành trình lúc này')
    } finally {
      setSyncing(false)
    }
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}/my-orders`)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận'
      case 'processing':
        return 'Đang chuẩn bị'
      case 'shipped':
        return 'Đang vận chuyển'
      case 'delivered':
        return 'Đã hoàn thành'
      case 'cancelled':
        return 'Đã hủy'
      default:
        return 'Đang xử lý'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center p-6 text-[#4A4238]">
        <div className="w-8 h-8 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#8C7E6A]">Đang tải dữ liệu đơn hàng...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center p-6 text-center text-[#4A4238]">
        <h2 className="font-serif text-xl sm:text-2xl font-light uppercase tracking-wider mb-2">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mb-6 font-thin">
          {error || 'Vui lòng kiểm tra lại mã đơn hàng hoặc đường link tra cứu.'}
        </p>
        <Link
          href="/shop"
          className="btn text-xs tracking-[0.2em] uppercase px-6 py-2.5 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors font-light"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#4A4238] font-sans pb-20">
      {/* Khoảng đệm bù chiều cao cho fixed main Header */}
      <div className="h-16 lg:h-20" />

      {/* Sticky Sub-Header Bar */}
      <div className="sticky top-16 lg:top-20 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1 text-[#4A4238] hover:text-[#8C7E6A] transition-colors cursor-pointer"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-serif uppercase tracking-widest font-light">
              Chi tiết đơn hàng
            </h1>
            <p className="text-[11px] text-[#8C7E6A] font-mono tracking-tight font-thin">
              #{order.orderNumber}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-light border border-[#8C7E6A]/30 text-[#8C7E6A] bg-[#8C7E6A]/10">
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        {/* Card 1: Stepper Timeline */}
        <div className="bg-white border border-stone-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
            <div>
              <h2 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-serif font-light text-[#4A4238]">
                Hành trình đơn hàng
              </h2>
              {order.sapoOrderNumber && (
                <p className="text-[10px] text-stone-400 mt-0.5 font-thin">
                  Mã tham chiếu: #{order.sapoOrderNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncTracking}
                disabled={syncing}
                title="Cập nhật trạng thái vận chuyển mới nhất"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-light text-[#4A4238] bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-[#8C7E6A] ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Đang kiểm tra...' : 'Làm mới hành trình'}</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8C7E6A] font-thin">
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
        <div className="bg-white border border-stone-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)] space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-light text-[#8C7E6A]">
            Thông tin người nhận
          </h2>
          <div className="text-xs text-stone-600 space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-[#8C7E6A] shrink-0" />
              <span className="font-light text-[#4A4238]">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-[#8C7E6A] shrink-0" />
              <span className="font-mono font-thin text-stone-700">{order.phoneNumber}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-[#8C7E6A] mt-0.5 shrink-0" />
              <span className="leading-relaxed font-thin">{order.shippingAddress}</span>
            </div>
            {order.note && (
              <div className="mt-2 pt-2 border-t border-stone-200 text-[11px] text-stone-500 italic font-thin">
                Ghi chú: {order.note}
              </div>
            )}
          </div>
        </div>

        {/* Card 2b: Thanh toán & Biên nhận chuyển khoản */}
        <div className="bg-white border border-stone-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-light text-[#8C7E6A] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#8C7E6A]" />
              <span>Thanh toán chuyển khoản (Non-COD)</span>
            </h2>

            {order.paymentStatus === 'paid' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-light tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ĐÃ THANH TOÁN
              </span>
            ) : order.paymentStatus === 'pending_approval' || order.paymentProofUrl ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-light tracking-wider text-amber-800 bg-amber-50 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                {order.paymentProofUrl ? 'ĐÃ GỬI BIÊN LAI • CHỜ DUYỆT' : 'ĐÃ XÁC NHẬN CHUYỂN KHOẢN • CHỜ DUYỆT'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-light tracking-wider text-red-700 bg-red-50 border border-red-200">
                CHƯA CHUYỂN KHOẢN
              </span>
            )}
          </div>

          <div className="text-xs space-y-3">
            {order.paymentStatus === 'paid' ? (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 text-emerald-800 text-[11px] font-thin leading-relaxed">
                Đơn hàng đã được xác nhận thanh toán thành công. ƯƠM. Archive đang đóng gói và chuẩn bị bàn giao cho đơn vị vận chuyển.
              </div>
            ) : order.paymentProofUrl ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px] font-thin leading-relaxed">
                  Chúng tôi đã nhận được ảnh biên nhận chuyển khoản của bạn và đang tiến hành kiểm tra xác minh. Email xác nhận chi tiết đơn hàng đã được gửi tới hòm thư của bạn.
                </div>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setViewProofModalOpen(true)}
                    className="relative cursor-pointer group border border-stone-200 overflow-hidden w-20 h-20 bg-stone-100 flex items-center justify-center shrink-0"
                    title="Nhấp để xem ảnh lớn"
                  >
                    <img
                      src={order.paymentProofUrl}
                      alt="Ảnh biên nhận chuyển khoản"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setViewProofModalOpen(true)}
                      className="text-xs font-light text-[#4A4238] hover:text-[#8C7E6A] underline underline-offset-2 flex items-center gap-1"
                    >
                      <span>Xem ảnh biên lai đã gửi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="text-[11px] font-thin text-stone-500 hover:text-[#4A4238] block"
                    >
                      Tải lại ảnh biên lai khác &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : order.transferClaimedAt ? (
              <div className="space-y-3">
                <div className="border border-amber-200 bg-amber-50/60 p-3 text-[11px] font-thin leading-relaxed text-amber-900">Đã ghi nhận bạn xác nhận chuyển khoản. Cửa hàng sẽ kiểm tra giao dịch; bạn có thể bổ sung ảnh biên nhận bên dưới.</div>
                <button type="button" onClick={() => setIsPaymentModalOpen(true)} className="flex w-full items-center justify-center gap-2 bg-[#4A4238] px-4 py-3 text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-[#8C7E6A]"><QrCode className="h-4 w-4" />Xem QR & bổ sung ảnh</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-stone-50 border border-stone-200 text-stone-600 text-[11px] font-thin leading-relaxed">
                  Đơn hàng của bạn đang chờ thanh toán chuyển khoản. Vui lòng quét mã QR hoặc chuyển khoản theo thông tin của shop và tải ảnh biên lai để hoàn tất xác nhận.
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors text-xs uppercase tracking-[0.2em] font-light flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-[#D8CFBE]" />
                  <span>Quét mã QR & Tải ảnh biên nhận ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Danh sách sản phẩm & Tổng tiền */}
        <div className="bg-white border border-stone-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,66,56,0.04)]">
          <h2 className="text-xs uppercase tracking-[0.2em] font-serif font-light text-[#8C7E6A] mb-4 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sản phẩm ({order.items?.length || 0})</span>
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 bg-stone-50 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
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
                    <p className="font-light text-[#4A4238] truncate">{item.productTitle}</p>
                    <p className="text-stone-400 font-thin text-[11px] mt-0.5">Số lượng: {item.quantity}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-[#4A4238] font-light text-xs sm:text-sm">
                    {(item.priceVND * item.quantity).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-4 mt-3 flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-light">
              Tổng thanh toán
            </span>
            <span className="font-mono text-base sm:text-lg font-light text-[#8C7E6A]">
              {Number(order.totalVND).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Bottom Help Actions */}
        <div className="text-center pt-4">
          <p className="text-[11px] font-thin text-stone-500">
            Cần thay đổi thông tin nhận hàng hoặc hỗ trợ thêm?
          </p>
          <Link
            href="/about"
            className="inline-block mt-2 text-xs uppercase tracking-[0.2em] font-light text-[#8C7E6A] underline underline-offset-4 hover:text-[#4A4238] transition-colors"
          >
            Liên hệ hỗ trợ khách hàng
          </Link>
        </div>
      </div>

      {/* Modal Chuyển khoản & Tải ảnh biên lai */}
      <PaymentTransferModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderNumber={order.orderNumber}
        paymentAccessToken={paymentAccessToken}
        totalVND={order.totalVND}
        paymentSettings={paymentSettings}
        onSuccess={(updated) => {
          setOrder(updated)
          setIsPaymentModalOpen(false)
        }}
        onSkip={() => setIsPaymentModalOpen(false)}
      />

      {/* Modal Xem ảnh biên nhận kích thước lớn */}
      {viewProofModalOpen && order.paymentProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <span className="text-xs font-serif uppercase tracking-wider font-light text-[#4A4238]">
                Ảnh biên nhận đơn hàng #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => setViewProofModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-stone-50">
              <img
                src={order.paymentProofUrl}
                alt="Biên nhận thanh toán"
                className="max-w-full max-h-[70vh] object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
