'use client'

import React, { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Upload,
  QrCode,
  Building,
  User,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface PaymentTransferModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  paymentAccessToken?: string
  totalVND: number
  paymentSettings?: {
    qrCodeUrl: string | null
    bankName: string
    accountNumber: string
    accountHolder: string
    transferInstruction: string
    transferTemplates?: { id: string; name: string; content: string }[]
    activeTemplateId?: string | null
    note?: string | null
  } | null
  onSuccess?: (updatedOrder: any) => void
  onSkip?: () => void
}

export function PaymentTransferModal({
  isOpen,
  onClose,
  orderNumber,
  paymentAccessToken,
  totalVND,
  paymentSettings,
  onSuccess,
  onSkip,
}: PaymentTransferModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  if (!isOpen) return null

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`Đã sao chép ${fieldName}`)
    setTimeout(() => {
      setCopiedField(null)
    }, 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleUploadProof = async () => {
    if (!paymentAccessToken) {
      toast.error('Vui lòng mở liên kết đơn hàng từ email xác nhận hoặc mục Đơn của tôi')
      return
    }
    if (!selectedFile) {
      toast.error('Vui lòng chọn hình ảnh biên nhận hoặc màn hình chuyển khoản')
      return
    }

    setUploading(true)
    try {
      const updatedOrder = await api.uploadPaymentProof(orderNumber, selectedFile, paymentAccessToken)
      setUploadSuccess(true)
      toast.success('Đã tải ảnh biên nhận chuyển khoản thành công!')
      if (onSuccess) {
        onSuccess(updatedOrder)
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.',
      )
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmWithoutProof = async () => {
    if (!paymentAccessToken) {
      toast.error('Vui lòng mở liên kết đơn hàng từ email xác nhận hoặc mục Đơn của tôi')
      return
    }
    setUploading(true)
    try {
      const updatedOrder = await api.confirmOrderTransfer(orderNumber, paymentAccessToken)
      setUploadSuccess(true)
      onSuccess?.(updatedOrder)
      toast.success('Đã ghi nhận xác nhận chuyển khoản. Cửa hàng sẽ kiểm tra giao dịch.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xác nhận chuyển khoản')
    } finally {
      setUploading(false)
    }
  }

  // QR Code URL: Sử dụng ảnh QR admin tải lên, hoặc tạo ảnh VietQR tự động
  const bankName = paymentSettings?.bankName || 'MB Bank'
  const accountNumber = paymentSettings?.accountNumber || ''
  const accountHolder = paymentSettings?.accountHolder || 'ƯƠM ARCHIVE'
  const activeTemplate = paymentSettings?.transferTemplates?.find((item) => item.id === paymentSettings.activeTemplateId)
  const transferContent = (activeTemplate?.content || '{orderNumber}')
    .replaceAll('{orderNumber}', orderNumber)
    .replaceAll('{totalVND}', String(totalVND))

  const qrImageUrl =
    paymentSettings?.qrCodeUrl ||
    (accountNumber
      ? `https://api.vietqr.io/image/${encodeURIComponent(bankName)}-${encodeURIComponent(accountNumber)}-compact.jpg?amount=${totalVND}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`
      : null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white border border-stone-200 shadow-2xl rounded-none sm:rounded-sm overflow-hidden z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#4A4238] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D8CFBE] font-serif font-thin block">
              Thanh toán chuyển khoản • Non-COD
            </span>
            <h2 className="text-lg font-serif font-light tracking-tight text-white mt-0.5">
              Đơn hàng #{orderNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {uploadSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-light text-[#4A4238]">
                  {selectedFile ? 'Đã tiếp nhận biên nhận chuyển khoản!' : 'Đã ghi nhận bạn xác nhận chuyển khoản!'}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed font-thin">
                  Cảm ơn bạn. ƯƠM. Archive sẽ xác minh giao dịch và gửi email xác nhận chi tiết đơn hàng tới hòm thư của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-[#4A4238] text-white text-xs uppercase tracking-[0.2em] font-light hover:bg-[#8C7E6A] transition-colors"
              >
                Xem hành trình đơn hàng
              </button>
            </div>
          ) : (
            <>
              {/* Box 1: QR Code & Thông tin chuyển khoản */}
              <div className="bg-[#FAF9F6] border border-stone-200 p-5 rounded-none sm:rounded-sm">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Mã QR */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-stone-200 pb-4 sm:pb-0 sm:pr-4">
                    {qrImageUrl ? (
                      <div className="bg-white p-2.5 border border-stone-200 shadow-sm max-w-[200px]">
                        <img
                          src={qrImageUrl}
                          alt="Mã QR chuyển khoản"
                          className="w-full aspect-square object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 bg-stone-100 border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 p-3">
                        <QrCode className="w-10 h-10 mb-2 opacity-40" />
                        <span className="text-[11px] text-center">Chuyển khoản theo STK bên cạnh</span>
                      </div>
                    )}
                    <p className="text-[11px] text-stone-500 mt-2 font-thin flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-[#8C7E6A]" />
                      Quét mã để thanh toán nhanh
                    </p>
                  </div>

                  {/* Thông tin tài khoản */}
                  <div className="sm:col-span-7 space-y-2.5 text-xs font-thin">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-thin">
                        Ngân hàng
                      </span>
                      <div className="font-light text-[#4A4238] flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-[#8C7E6A]" />
                        <span>{bankName}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-thin">
                        Số tài khoản
                      </span>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 border border-stone-200 mt-0.5">
                        <span className="font-mono font-light text-sm text-[#4A4238]">
                          {accountNumber || '(Liên hệ Admin)'}
                        </span>
                        {accountNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(accountNumber, 'Số tài khoản')}
                            className="text-[#8C7E6A] hover:text-[#4A4238] transition-colors p-1"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'Số tài khoản' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-thin">
                        Chủ tài khoản
                      </span>
                      <div className="font-light uppercase tracking-wider text-[#4A4238] flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-[#8C7E6A]" />
                        <span>{accountHolder}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-thin">
                        Số tiền cần chuyển
                      </span>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 border border-stone-200 mt-0.5">
                        <span className="font-mono font-light text-sm text-[#8C7E6A]">
                          {totalVND.toLocaleString('vi-VN')} ₫
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(totalVND), 'Số tiền')}
                          className="text-[#8C7E6A] hover:text-[#4A4238] transition-colors p-1"
                          title="Sao chép số tiền"
                        >
                          {copiedField === 'Số tiền' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-thin">
                        Nội dung chuyển khoản (Bắt buộc)
                      </span>
                      <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 px-2.5 py-1.5 mt-0.5">
                        <span className="font-mono font-light text-xs text-amber-900">
                          {transferContent}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(transferContent, 'Nội dung chuyển khoản')}
                          className="text-amber-800 hover:text-amber-950 transition-colors p-1"
                          title="Sao chép nội dung"
                        >
                          {copiedField === 'Nội dung chuyển khoản' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentSettings?.transferInstruction && (
                  <p className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500 italic font-thin">
                    {paymentSettings.transferInstruction}
                  </p>
                )}
              </div>

              {/* Box 2: Tải lên ảnh biên nhận chuyển khoản */}
              <div className="space-y-3">
                {!paymentAccessToken && (
                  <p className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-thin">
                    Để xác nhận chuyển khoản, hãy mở đơn hàng từ email xác nhận hoặc mục Đơn của tôi.
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xs uppercase tracking-[0.2em] font-light text-[#4A4238] flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#8C7E6A]" />
                    <span>Tải ảnh biên lai / Bill chuyển khoản</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 font-thin">Tối đa 10MB (PNG, JPG)</span>
                </div>

                {previewUrl ? (
                  <div className="relative border border-stone-200 p-2 bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Xem trước biên nhận"
                        className="w-16 h-16 object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 text-xs">
                        <p className="font-light text-[#4A4238] truncate">{selectedFile?.name}</p>
                        <p className="text-stone-400 text-[10px] font-thin">
                          {selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                      title="Chọn ảnh khác"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-200 hover:border-[#8C7E6A] bg-stone-50/50 hover:bg-stone-50 transition-colors p-6 flex flex-col items-center justify-center cursor-pointer text-center">
                    <ImageIcon className="w-8 h-8 text-stone-400 stroke-[1.2] mb-2" />
                    <span className="text-xs font-light text-[#4A4238]">
                      Nhấp để tải lên ảnh chụp màn hình chuyển khoản
                    </span>
                    <span className="text-[10px] text-stone-400 mt-1 font-thin">
                      Hỗ trợ định dạng JPG, PNG, WebP
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={uploading || !paymentAccessToken}
                    onClick={selectedFile ? handleUploadProof : handleConfirmWithoutProof}
                    className="w-full sm:flex-1 py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors text-xs uppercase tracking-[0.2em] font-light text-center flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xác nhận đã chuyển khoản</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSkip) {
                        onSkip()
                      } else {
                        onClose()
                      }
                    }}
                    className="w-full sm:w-auto py-3 px-4 text-xs uppercase tracking-wider text-stone-500 hover:text-[#4A4238] transition-colors font-thin text-center"
                  >
                    Tôi sẽ tải biên nhận sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
