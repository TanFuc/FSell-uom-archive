'use client'

import React, { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  Eye,
  Check,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  // Modals
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminOrders({
        page,
        limit: 20,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        search: submittedSearch,
      })
      setOrders(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err: any) {
      toast.error('Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentStatusFilter, submittedSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSubmittedSearch(searchQuery.trim())
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(`status-${orderId}`)
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus)
      toast.success(
        newStatus === 'processing'
          ? `Đã xác nhận đơn hàng #${updated.orderNumber} và gửi email thông báo tới khách hàng!`
          : `Đã cập nhật trạng thái đơn #${updated.orderNumber} thành công!`,
      )
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      if (detailOrder?.id === orderId) {
        setDetailOrder(updated)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    setActionLoading(`payment-${orderId}`)
    try {
      const updated = await api.updateOrderPaymentStatus(orderId, newPaymentStatus)
      toast.success(
        newPaymentStatus === 'paid'
          ? `Đã duyệt thanh toán đơn #${updated.orderNumber} và gửi email xác nhận!`
          : `Đã cập nhật trạng thái thanh toán đơn #${updated.orderNumber}`,
      )
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      if (detailOrder?.id === orderId) {
        setDetailOrder(updated)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái thanh toán')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendConfirmationEmail = async (orderId: string) => {
    setActionLoading(`email-${orderId}`)
    try {
      const res = await api.sendOrderConfirmationEmail(orderId)
      if (res.success) {
        toast.success(`Đã gửi email xác nhận thành công tới ${res.customerEmail}`)
      } else {
        toast.error(`Gửi mail thất bại: ${res.error || 'Kiểm tra cấu hình SMTP'}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi email xác nhận')
    } finally {
      setActionLoading(null)
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200">
            Chờ xử lý
          </span>
        )
      case 'processing':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200">
            Đang chuẩn bị
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200">
            Đang vận chuyển
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200">
            Đã hoàn thành
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-300">
            Đã hủy
          </span>
        )
      default:
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200">
            {status}
          </span>
        )
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string, hasProof: boolean) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Đã thanh toán
        </span>
      )
    }

    if (paymentStatus === 'pending_approval' || hasProof) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Chờ duyệt chuyển khoản
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200">
        Chưa chuyển khoản
      </span>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#8C7E6A]" />
            <span>Quản lý đơn hàng</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Theo dõi đơn hàng, đối chiếu hình ảnh chuyển khoản (Non-COD) và gửi email xác nhận.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="text-xs h-9 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 border border-neutral-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên, SĐT, email..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Trạng thái đơn hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái đơn</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang chuẩn bị (Đã xác nhận)</SelectItem>
                <SelectItem value="shipped">Đang vận chuyển</SelectItem>
                <SelectItem value="delivered">Đã hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={paymentStatusFilter}
              onValueChange={(val) => {
                setPaymentStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Trạng thái thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thanh toán</SelectItem>
                <SelectItem value="unpaid">Chưa chuyển khoản</SelectItem>
                <SelectItem value="pending_approval">Chờ duyệt chuyển khoản</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full text-xs h-9 bg-[#4A4238] hover:bg-[#8C7E6A] text-white">
              Tìm kiếm
            </Button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-medium uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Ngày đặt</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Thanh toán</th>
                <th className="py-3 px-4 text-center">Biên lai CK</th>
                <th className="py-3 px-4 text-center">Trạng thái đơn</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <div className="w-6 h-6 border-2 border-[#8C7E6A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const hasProof = Boolean(order.paymentProofUrl)
                  const isPaid = order.paymentStatus === 'paid'

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Mã đơn */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-semibold text-neutral-900 block">
                          #{order.orderNumber}
                        </span>
                        {order.sapoOrderNumber && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            Sapo: #{order.sapoOrderNumber}
                          </span>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-medium text-neutral-900 block truncate">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          {order.phoneNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 block truncate">
                          {order.customerEmail}
                        </span>
                      </td>

                      {/* Ngày đặt */}
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        <span className="block text-[10px] text-neutral-400">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900">
                        {Number(order.totalVND).toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Trạng thái thanh toán */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getPaymentStatusBadge(order.paymentStatus, hasProof)}
                      </td>

                      {/* Ảnh biên lai chuyển khoản */}
                      <td className="py-3.5 px-4 text-center">
                        {order.paymentProofUrl ? (
                          <div
                            onClick={() => setSelectedProofUrl(order.paymentProofUrl)}
                            className="inline-block relative cursor-pointer group border border-neutral-200 overflow-hidden w-11 h-11 bg-neutral-100 rounded-sm"
                            title="Bấm để xem ảnh biên lai lớn"
                          >
                            <img
                              src={order.paymentProofUrl}
                              alt="Biên lai"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="py-3.5 px-4 text-center">
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleUpdateStatus(order.id, val)}
                          disabled={actionLoading === `status-${order.id}`}
                        >
                          <SelectTrigger className="h-7 text-[11px] px-2 w-[130px] mx-auto">
                            <SelectValue>{getOrderStatusBadge(order.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Chờ xử lý</SelectItem>
                            <SelectItem value="processing">Đang chuẩn bị (Xác nhận)</SelectItem>
                            <SelectItem value="shipped">Đang vận chuyển</SelectItem>
                            <SelectItem value="delivered">Đã hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Duyệt thanh toán nhanh nếu có bill hoặc khách chuyển khoản */}
                          {!isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                              disabled={actionLoading === `payment-${order.id}`}
                              className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              title="Duyệt thanh toán thành công và gửi email xác nhận"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Duyệt CK
                            </Button>
                          )}

                          {/* Nút Gửi lại email xác nhận đơn */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendConfirmationEmail(order.id)}
                            disabled={actionLoading === `email-${order.id}`}
                            className="h-7 w-7 p-0 text-neutral-500 hover:text-neutral-900"
                            title="Gửi lại email xác nhận đơn hàng"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>

                          {/* Nút Chi tiết */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailOrder(order)}
                            className="h-7 px-2 text-[11px] text-[#4A4238] hover:bg-neutral-100"
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
            <div>
              Hiển thị {orders.length} / {total} đơn hàng
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs"
              >
                Trước
              </Button>
              <span className="px-2">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Xem ảnh biên nhận chuyển khoản phóng to */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-xl w-full bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3">
              <span className="text-xs font-serif uppercase tracking-wider font-semibold text-[#4A4238]">
                Hình ảnh biên nhận chuyển khoản của khách hàng
              </span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-neutral-100 p-2">
              <img
                src={selectedProofUrl}
                alt="Biên nhận thanh toán"
                className="max-w-full max-h-[70vh] object-contain shadow-sm"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedProofUrl(null)}
                className="text-xs h-8"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết đơn hàng */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#4A4238] text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#D8CFBE] font-serif block">
                  Chi tiết đơn hàng
                </span>
                <h3 className="font-serif font-bold text-base mt-0.5">
                  #{detailOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-1.5 text-stone-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Box 1: Thông tin khách hàng & Giao nhận */}
              <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-2.5">
                <h4 className="font-serif font-semibold text-xs uppercase tracking-wider text-[#8C7E6A]">
                  Thông tin người nhận
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-700">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span className="font-medium text-neutral-900">{detailOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span className="font-mono">{detailOrder.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span>{detailOrder.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#8C7E6A]" />
                    <span>{new Date(detailOrder.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-neutral-200">
                    <MapPin className="w-3.5 h-3.5 text-[#8C7E6A] shrink-0 mt-0.5" />
                    <span>{detailOrder.shippingAddress}</span>
                  </div>
                  {detailOrder.note && (
                    <div className="sm:col-span-2 text-neutral-500 italic">
                      Ghi chú: {detailOrder.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Trạng thái thanh toán & Ảnh biên nhận */}
              <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-xs uppercase tracking-wider text-[#8C7E6A]">
                    Thanh toán chuyển khoản (Non-COD)
                  </h4>
                  {getPaymentStatusBadge(detailOrder.paymentStatus, Boolean(detailOrder.paymentProofUrl))}
                </div>
                <div className="text-xs text-neutral-600 space-y-1">
                  <p>Khách xác nhận đã chuyển: {detailOrder.transferClaimedAt ? new Date(detailOrder.transferClaimedAt).toLocaleString('vi-VN') : 'Chưa xác nhận'}</p>
                  <p>Ảnh biên nhận: {detailOrder.paymentProofUploadedAt ? new Date(detailOrder.paymentProofUploadedAt).toLocaleString('vi-VN') : 'Chưa tải lên'}</p>
                  <p>Cửa hàng duyệt thanh toán: {detailOrder.paymentConfirmedAt ? new Date(detailOrder.paymentConfirmedAt).toLocaleString('vi-VN') : 'Chưa duyệt'}</p>
                </div>

                {detailOrder.paymentProofUrl ? (
                  <div className="flex items-center gap-4 pt-1">
                    <div
                      onClick={() => setSelectedProofUrl(detailOrder.paymentProofUrl)}
                      className="cursor-pointer group relative border border-neutral-200 overflow-hidden w-20 h-20 bg-white flex items-center justify-center shrink-0"
                    >
                      <img
                        src={detailOrder.paymentProofUrl}
                        alt="Biên nhận"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-medium text-neutral-800">Ảnh biên nhận khách hàng đã tải lên</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProofUrl(detailOrder.paymentProofUrl)}
                        className="h-7 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem ảnh phóng to</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-400 italic">Khách hàng chưa tải lên hình ảnh biên nhận chuyển khoản.</p>
                )}
              </div>

              {/* Box 3: Danh sách sản phẩm */}
              <div className="space-y-2">
                <h4 className="font-serif font-semibold text-xs uppercase tracking-wider text-[#8C7E6A]">
                  Tác phẩm đã đặt ({detailOrder.items?.length || 0})
                </h4>
                <div className="border border-neutral-200 divide-y divide-neutral-100">
                  {detailOrder.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productTitle} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-neutral-400 m-auto mt-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{item.productTitle}</p>
                          <p className="text-[10px] text-neutral-400">SL: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-neutral-900">
                        {(item.priceVND * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-baseline pt-2 px-1">
                  <span className="font-semibold text-neutral-700">Tổng thanh toán:</span>
                  <span className="font-mono font-bold text-sm text-[#8C7E6A]">
                    {Number(detailOrder.totalVND).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendConfirmationEmail(detailOrder.id)}
                  disabled={actionLoading === `email-${detailOrder.id}`}
                  className="text-xs h-8 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#8C7E6A]" />
                  <span>Gửi lại email xác nhận</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {detailOrder.paymentStatus !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(detailOrder.id, 'paid')}
                    disabled={actionLoading === `payment-${detailOrder.id}`}
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Xác nhận thanh toán
                  </Button>
                )}
                {detailOrder.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(detailOrder.id, 'processing')}
                    disabled={actionLoading === `status-${detailOrder.id}`}
                    className="text-xs h-8 bg-[#4A4238] hover:bg-[#8C7E6A] text-white"
                  >
                    Xác nhận đơn hàng
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailOrder(null)}
                  className="text-xs h-8"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
