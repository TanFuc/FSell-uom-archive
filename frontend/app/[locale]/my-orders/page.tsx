'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/api'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getMyOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Chờ xác nhận', color: 'text-amber-700 bg-amber-50 border-amber-200' }
      case 'processing':
        return { label: 'Đang đóng gói', color: 'text-blue-700 bg-blue-50 border-blue-200' }
      case 'shipped':
        return { label: 'Đang giao hàng', color: 'text-[#8C7E6A] bg-[#8C7E6A]/10 border-[#8C7E6A]/30' }
      case 'delivered':
        return { label: 'Đã hoàn thành', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      case 'cancelled':
        return { label: 'Đã hủy', color: 'text-red-700 bg-red-50 border-red-200' }
      default:
        return { label: status, color: 'text-stone-700 bg-stone-50 border-stone-200' }
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F1] text-[#4A4238] font-sans pb-20">
      {/* Khoảng đệm bù chiều cao cho fixed main Header */}
      <div className="h-20 lg:h-28" />

      {/* Top Header */}
      <div className="sticky top-20 lg:top-28 z-20 bg-[#F9F7F1]/95 backdrop-blur-md border-b border-[#ECE8DF] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/shop" className="p-1 -ml-1 text-[#4A4238] hover:text-[#8C7E6A] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-serif uppercase tracking-widest font-semibold">
            Đơn hàng của tôi
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#8C7E6A]">Đang tải danh sách đơn...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="min-h-[50vh] bg-white/90 border border-[#ECE8DF] p-8 text-center flex flex-col items-center justify-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-[#8C7E6A] stroke-[1.2] mb-3 opacity-60" />
            <h3 className="font-serif text-base uppercase tracking-wider mb-1">Chưa có đơn hàng nào</h3>
            <p className="text-xs text-stone-500 mb-5">Bạn chưa thực hiện đơn đặt hàng nào gần đây.</p>
            <Link
              href="/shop"
              className="btn text-xs tracking-[0.2em] uppercase px-6 py-2.5 bg-[#4A4238] text-white hover:bg-[#8C7E6A] transition-colors"
            >
              Xem bộ sưu tập
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const badge = getStatusBadge(order.status)
            return (
              <Link
                key={order.id}
                href={`/order-tracking/${order.orderNumber || order.id}`}
                className="block bg-white/90 backdrop-blur-sm border border-[#ECE8DF] p-4 sm:p-5 shadow-[0_4px_16px_rgba(74,66,56,0.03)] hover:border-[#8C7E6A]/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EDE6] mb-3">
                  <div>
                    <span className="font-mono text-xs font-semibold tracking-tight text-[#4A4238]">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[11px] text-stone-400 block sm:inline sm:ml-2">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <p className="line-clamp-1 font-medium text-[#4A4238]">
                    {order.items?.map((i: any) => `${i.productTitle} (x${i.quantity})`).join(', ')}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-stone-400">
                      Tổng số {order.items?.length || 0} sản phẩm
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#8C7E6A]">
                      {Number(order.totalVND).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#F0EDE6] flex items-center justify-between text-[11px] text-[#8C7E6A] font-medium uppercase tracking-wider">
                  <span>Xem chi tiết & Tracking</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
