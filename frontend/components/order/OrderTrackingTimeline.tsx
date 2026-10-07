'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'

interface TrackingTimelineProps {
  orderId?: string
  sapoOrderId?: string | null
  status: string // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string | null
  trackingCompany?: string | null
  trackingUrl?: string | null
  createdAt?: string
  updatedAt?: string
  onSyncTracking?: () => Promise<void> | void
  isSyncing?: boolean
}

export function OrderTrackingTimeline({
  orderId,
  sapoOrderId,
  status,
  trackingNumber,
  trackingCompany,
  trackingUrl,
  createdAt,
  updatedAt,
  onSyncTracking,
  isSyncing = false,
}: TrackingTimelineProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const isCancelled = status === 'cancelled'

  const copyTrackingNumber = () => {
    if (!trackingNumber) return
    navigator.clipboard.writeText(trackingNumber)
    setIsCopied(true)
    toast.success('Đã sao chép mã vận đơn vào bộ nhớ tạm')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const steps = [
    {
      key: 'pending',
      title: 'Chờ xác nhận',
      badge: status === 'pending' ? 'Đang thực hiện' : 'Đã hoàn thành',
      description: 'Đơn hàng đã được tiếp nhận thành công và chuyển tới xưởng nghệ nhân.',
      icon: Clock,
      date: createdAt,
    },
    {
      key: 'processing',
      title: 'Đang đóng gói',
      badge:
        status === 'processing'
          ? 'Đang thực hiện'
          : ['shipped', 'delivered'].includes(status)
            ? 'Đã hoàn thành'
            : 'Chờ xử lý',
      description: 'Cửa hàng đang kiểm định chất lượng men và đóng gói chống sốc chuyên dụng.',
      icon: Package,
    },
    {
      key: 'shipped',
      title: 'Đang vận chuyển',
      badge:
        status === 'shipped'
          ? 'Đang giao hàng'
          : status === 'delivered'
            ? 'Đã hoàn thành'
            : 'Chờ giao hàng',
      description: trackingNumber
        ? `Kiện hàng đã bàn giao cho ${trackingCompany || 'đối tác giao vận'}. Mã vận đơn: ${trackingNumber}.`
        : 'Kiện hàng đang trên lộ trình trung chuyển đến bưu cục phát.',
      icon: Truck,
      isShippedStage: true,
    },
    {
      key: 'delivered',
      title: 'Giao hàng thành công',
      badge: status === 'delivered' ? 'Đã nhận hàng' : 'Dự kiến',
      description: 'Kiện hàng gốm sứ đã được trao tận tay quý khách an toàn.',
      icon: CheckCircle2,
      date: status === 'delivered' ? updatedAt : undefined,
    },
  ]

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'pending':
        return 0
      case 'processing':
        return 1
      case 'shipped':
        return 2
      case 'delivered':
        return 3
      default:
        return 0
    }
  }

  const currentIdx = getStepIndex(status)

  if (isCancelled) {
    return (
      <div className="p-5 rounded-sm border border-red-200 bg-red-50/70 text-red-900 flex items-start gap-4">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-serif font-semibold text-sm uppercase tracking-wider">Đơn hàng đã bị hủy</h4>
          <p className="text-xs text-red-700/80 leading-relaxed">
            Đơn hàng này đã được xác nhận hủy trên hệ thống. Nếu có bất kỳ thắc mắc nào, quý khách vui lòng liên hệ hotline hỗ trợ ƯƠM. Archive để được trợ giúp kịp thời.
          </p>
        </div>
      </div>
    )
  }

  // Các giai đoạn chi tiết giao vận bên Sapo / Đối tác bưu chính
  const shippingStages = [
    {
      stage: 'Chặng 1: Bàn giao bưu cục',
      title: 'Bàn giao kiện hàng',
      desc: `ƯƠM. Archive đã đóng gói và bàn giao kiện cho ${trackingCompany || 'đối tác vận chuyển'}.`,
      isDone: currentIdx >= 2,
      isCurrent: currentIdx === 2 && !trackingNumber,
      time: createdAt,
    },
    {
      stage: 'Chặng 2: Luân chuyển trung tâm',
      title: 'Xuất kho trung chuyển',
      desc: 'Kiện hàng đang trên xe chuyên dụng luân chuyển giữa các bưu cục trung tâm.',
      isDone: currentIdx >= 2 && Boolean(trackingNumber),
      isCurrent: currentIdx === 2 && Boolean(trackingNumber),
      time: updatedAt,
    },
    {
      stage: 'Chặng 3: Đang phát hàng',
      title: 'Bưu tá đang giao',
      desc: 'Bưu tá khu vực đã nhận hàng và đang di chuyển tới địa chỉ của quý khách.',
      isDone: currentIdx === 3,
      isCurrent: false,
    },
    {
      stage: 'Chặng 4: Hoàn tất',
      title: 'Giao hàng thành công',
      desc: 'Quý khách kiểm tra hàng và ký nhận từ nhân viên bưu tá.',
      isDone: currentIdx === 3,
      isCurrent: currentIdx === 3,
    },
  ]

  return (
    <div className="py-3 sm:py-5">
      {/* Timeline Stepper Container với khoảng cách thoáng đãng, sang trọng */}
      <div className="relative pl-10 sm:pl-14 space-y-10 sm:space-y-12 before:absolute before:left-[19px] sm:before:left-[23px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#8C7E6A] before:via-[#C5BDAF] before:to-[#E8E4DC]">
        {steps.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="relative group">
              {/* Stepper Dot / Icon với kích thước lớn và hiệu ứng hào quang */}
              <div
                className={`absolute -left-[40px] sm:-left-[48px] top-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isDone
                    ? 'bg-[#8C7E6A] text-white'
                    : isCurrent
                      ? 'bg-[#4A4238] text-white ring-4 ring-[#8C7E6A]/25 shadow-md scale-105'
                      : 'bg-[#F2ECE1] text-[#A69B8D] border border-[#DDD6C8]'
                  }`}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              {/* Step Content */}
              <div className="bg-[#FAF8F2]/60 hover:bg-[#FAF8F2] border border-[#ECE8DF] p-4 sm:p-5 rounded-sm transition-all duration-200">
                {/* Header hàng trạng thái */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#ECE8DF]/60">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4
                      className={`text-xs sm:text-sm uppercase tracking-[0.2em] font-serif font-bold ${isCurrent
                          ? 'text-[#4A4238]'
                          : isDone
                            ? 'text-[#4A4238]'
                            : 'text-stone-400'
                        }`}
                    >
                      {step.title}
                    </h4>

                    {/* Badge trạng thái */}
                    <span
                      className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold rounded-xs border ${isCurrent
                          ? 'bg-[#4A4238] text-white border-[#4A4238]'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-400 border-stone-200'
                        }`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  {step.date && (
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8C7E6A]" />
                      {new Date(step.date).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Mô tả giai đoạn */}
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {step.description}
                </p>

                {/* NÚT & KHUNG XEM CHI TIẾT GIAI ĐOẠN VẬN CHUYỂN SAPO */}
                {step.isShippedStage && (
                  <div className="mt-4 pt-3 border-t border-[#ECE8DF] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDetailOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors text-xs uppercase tracking-wider font-medium shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5 text-stone-200" />
                        <span>{isDetailOpen ? 'Thu gọn hành trình Sapo' : 'Xem chi tiết giai đoạn vận chuyển'}</span>
                        {isDetailOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-1" />
                        )}
                      </button>

                      {onSyncTracking && (
                        <button
                          type="button"
                          onClick={() => onSyncTracking()}
                          disabled={isSyncing}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#D5CFC4] hover:border-[#8C7E6A] text-stone-700 hover:text-[#4A4238] transition-colors text-[11px] font-medium"
                          title="Gọi Sapo API để cập nhật dữ liệu vận chuyển mới nhất"
                        >
                          <RefreshCw className={`w-3 h-3 text-[#8C7E6A] ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Đang cập nhật...' : 'Làm mới hành trình'}</span>
                        </button>
                      )}
                    </div>

                    {/* Vùng chi tiết giai đoạn khi mở rộng */}
                    {isDetailOpen && (
                      <div className="mt-3 p-4 bg-white border border-[#E5DFD4] rounded-xs shadow-xs space-y-4">
                        {/* Hàng thông tin mã vận đơn & đơn vị */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#F0EDE6] text-xs">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                              Đối tác giao vận
                            </span>
                            <span className="font-medium text-[#4A4238]">
                              {trackingCompany || 'Đơn vị vận chuyển liên kết Sapo'}
                            </span>
                            {orderId && (
                              <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                                Đơn hàng: #{orderId} {sapoOrderId ? `• Sapo #${sapoOrderId}` : ''}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                              Mã vận đơn (Tracking Code)
                            </span>
                            {trackingNumber ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-[#8C7E6A]">
                                  {trackingNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={copyTrackingNumber}
                                  className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-[#4A4238] transition-colors"
                                  title="Sao chép mã"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">Đang cập nhật mã từ hệ thống Sapo</span>
                            )}
                          </div>
                        </div>

                        {/* Danh sách 4 chặng vận chuyển */}
                        <div className="space-y-3 pt-1">
                          <p className="text-[10px] uppercase tracking-[0.2em] font-serif font-bold text-[#8C7E6A]">
                            Các chặng giao vận chi tiết
                          </p>

                          <div className="space-y-2.5">
                            {shippingStages.map((stg, sIdx) => (
                              <div
                                key={sIdx}
                                className={`p-3 rounded-xs border flex items-start gap-3 transition-colors ${stg.isCurrent
                                    ? 'bg-[#FAF8F2] border-[#8C7E6A]/50 ring-1 ring-[#8C7E6A]/20'
                                    : stg.isDone
                                      ? 'bg-stone-50/70 border-stone-200'
                                      : 'bg-white border-dashed border-stone-200 opacity-60'
                                  }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {stg.isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : stg.isCurrent ? (
                                    <Truck className="w-4 h-4 text-[#8C7E6A] animate-pulse" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-stone-300" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6A]">
                                      {stg.stage}
                                    </span>
                                    {stg.time && (
                                      <span className="text-[10px] text-stone-400 font-mono">
                                        {new Date(stg.time).toLocaleDateString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          day: '2-digit',
                                          month: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium text-[#4A4238] mt-0.5">{stg.title}</p>
                                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{stg.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nút bấm liên kết tra cứu trực tiếp */}
                        {trackingUrl && (
                          <div className="pt-2">
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 border border-[#8C7E6A] text-[#8C7E6A] hover:bg-[#8C7E6A] hover:text-white transition-all text-xs uppercase tracking-wider font-medium"
                            >
                              <span>Mở cổng tra cứu trực tiếp của nhà vận chuyển</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
