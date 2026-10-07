'use client'

import React from 'react'
import { CheckCircle2, Clock, Package, Truck, XCircle, ExternalLink } from 'lucide-react'

interface TrackingTimelineProps {
  status: string // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string | null
  trackingCompany?: string | null
  trackingUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export function OrderTrackingTimeline({
  status,
  trackingNumber,
  trackingCompany,
  trackingUrl,
  createdAt,
  updatedAt,
}: TrackingTimelineProps) {
  const isCancelled = status === 'cancelled'

  const steps = [
    {
      key: 'pending',
      title: 'Chờ xác nhận',
      description: 'Đơn hàng đã được tiếp nhận thành công trên hệ thống',
      icon: Clock,
      date: createdAt,
    },
    {
      key: 'processing',
      title: 'Đang đóng gói',
      description: 'Cửa hàng đang kiểm tra và đóng gói gốm thủ công cẩn thận',
      icon: Package,
    },
    {
      key: 'shipped',
      title: 'Đang vận chuyển',
      description: trackingNumber
        ? `Đơn vị vận chuyển: ${trackingCompany || 'Đối tác vận chuyển'} • Mã vận đơn: ${trackingNumber}`
        : 'Kiện hàng đã được bàn giao cho đối tác vận chuyển',
      icon: Truck,
      extra: trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-none border border-[#8C7E6A] text-[#8C7E6A] hover:bg-[#8C7E6A] hover:text-white transition-all text-[11px] font-medium uppercase tracking-wider"
        >
          <span>Tra cứu hành trình vận chuyển</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: 'delivered',
      title: 'Giao hàng thành công',
      description: 'Kiện hàng đã được giao tận tay quý khách',
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
      <div className="p-4 rounded border border-red-200 bg-red-50/70 text-red-900 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-serif font-semibold text-sm tracking-wide">Đơn hàng đã bị hủy</h4>
          <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
            Đơn hàng này đã được xác nhận hủy trên hệ thống. Nếu có thắc mắc, quý khách vui lòng liên hệ hotline hoặc trang hỗ trợ của chúng tôi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="relative pl-7 sm:pl-9 space-y-7 before:absolute before:left-[13px] sm:before:left-[17px] before:top-2.5 before:bottom-2.5 before:w-[1.5px] before:bg-[#E5E0D8]">
        {steps.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="relative group">
              {/* Stepper Dot / Icon */}
              <div
                className={`absolute -left-[27px] sm:-left-[35px] top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-[#8C7E6A] text-white'
                    : isCurrent
                    ? 'bg-[#4A4238] text-white ring-4 ring-[#8C7E6A]/20'
                    : 'bg-[#F0EDE6] text-[#A69B8D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              {/* Step Content */}
              <div className="pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4
                    className={`text-xs sm:text-sm uppercase tracking-wider font-medium ${
                      isCurrent
                        ? 'text-[#4A4238] font-semibold'
                        : isDone
                        ? 'text-[#4A4238]'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.date && (
                    <span className="text-[11px] text-stone-400 font-mono">
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
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  {step.description}
                </p>
                {step.extra}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
