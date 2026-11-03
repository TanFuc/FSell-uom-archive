'use client'

import React from 'react'
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'

interface LegalModalProps {
  isOpen: boolean
  type: 'terms' | 'privacy'
  onClose: () => void
}

export function LegalModal({ isOpen, type, onClose }: LegalModalProps) {
  if (!isOpen) return null

  const isPrivacy = type === 'privacy'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white border border-stone-200 shadow-2xl z-10 flex flex-col rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#8C7E6A]/15 flex items-center justify-center text-[#4A4238] shrink-0 border border-[#8C7E6A]/20">
              {isPrivacy ? <ShieldCheck className="w-4 h-4 text-[#4A4238]" /> : <FileText className="w-4 h-4 text-[#4A4238]" />}
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[#3D332A]">
                {isPrivacy ? 'Chính sách bảo vệ dữ liệu cá nhân' : 'Điều khoản sử dụng dịch vụ'}
              </h3>
              <p className="text-[11px] text-[#8C7E6A] font-light">
                {isPrivacy ? 'Theo Nghị định 13/2023/NĐ-CP & Nghị định 52/2013/NĐ-CP' : 'ƯƠM. Archive • Gốm thủ công Việt Nam'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-stone-400 hover:text-[#4A4238] transition-colors rounded"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs text-stone-700 font-light leading-relaxed">
          {isPrivacy ? (
            <>
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xs text-[11px] text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <p>
                  ƯƠM. Archive cam kết bảo vệ toàn vẹn dữ liệu cá nhân của quý khách theo quy định của pháp luật Việt Nam. Dữ liệu chỉ phục vụ mục đích xử lý đơn hàng và bàn giao gốm sứ an toàn.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  1. Mục đích thu thập dữ liệu cá nhân
                </h4>
                <p>
                  Thông tin cá nhân (Họ tên, Email, Số điện thoại, Địa chỉ giao hàng) được thu thập chỉ nhằm:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-stone-600">
                  <li>Tiếp nhận, xử lý, đóng gói và giao hàng đơn mua gốm sứ.</li>
                  <li>Thông báo mã vận đơn và cập nhật hành trình giao hàng qua email/SMS.</li>
                  <li>Hỗ trợ đổi trả, bảo hành bể vỡ khi vận chuyển và giải đáp khiếu nại.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  2. Phạm vi thu thập & Thanh toán an toàn
                </h4>
                <p>
                  ƯƠM. Archive chỉ thu thập thông tin người nhận cơ bản. Hệ thống <strong>không lưu trữ</strong> thông tin tài khoản ngân hàng hay thẻ tín dụng của quý khách; toàn bộ thanh toán chuyển khoản được thực hiện trực tiếp giữa quý khách và ngân hàng thụ hưởng.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  3. Thời gian lưu trữ thông tin
                </h4>
                <p>
                  Dữ liệu cá nhân được lưu trữ bảo mật trong suốt thời gian tài khoản thành viên hoạt động trên website, hoặc cho đến khi quý khách có yêu cầu hủy bỏ thông tin qua các kênh hỗ trợ của ƯƠM.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  4. Quyền của chủ thể dữ liệu (Khách hàng)
                </h4>
                <p>
                  Quý khách có toàn quyền yêu cầu tra cứu, điều chỉnh thông tin hoặc yêu cầu ƯƠM. xóa vĩnh viễn dữ liệu cá nhân của mình bất kỳ lúc nào. Chúng tôi cam kết tuyệt đối không bán hoặc chia sẻ thông tin cho bên thứ ba vì mục đích tiếp thị thương mại.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  1. Tài khoản thành viên
                </h4>
                <p>
                  Khi đăng ký tài khoản tại ƯƠM. Archive, quý khách cam kết cung cấp thông tin liên hệ chính xác để phục vụ quá trình liên hệ xác nhận đơn hàng và giao nhận gốm sứ.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  2. Đặt hàng & Xác nhận thanh toán
                </h4>
                <p>
                  Đối với đơn hàng thanh toán chuyển khoản (Non-COD), quý khách vui lòng quét mã VietQR hoặc chuyển khoản đúng nội dung mã đơn hàng và tải ảnh biên nhận để cửa hàng đối soát và xuất xưởng nhanh chóng.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  3. Quyền đồng kiểm khi nhận hàng
                </h4>
                <p>
                  ƯƠM. khuyến khích quý khách đồng kiểm sản phẩm cùng nhân viên giao vận tại thời điểm nhận hàng để kiểm tra tính nguyên vẹn của men gốm và các chi tiết thủ công.
                </p>
              </div>

              <div>
                <h4 className="font-serif text-xs uppercase tracking-wider font-semibold text-[#3D332A] mb-1.5">
                  4. Cam kết bảo hành bể vỡ 100%
                </h4>
                <p>
                  Nếu sản phẩm không may bị rạn nứt hoặc bể vỡ do quá trình vận chuyển, ƯƠM. Archive cam kết đổi mới 1-1 hoặc hoàn tiền 100% cho quý khách trong vòng 48 giờ kể từ khi nhận được phản hồi.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#4A4238] hover:bg-[#8C7E6A] text-white text-xs uppercase tracking-[0.15em] font-light transition-colors rounded-xs shadow-xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

