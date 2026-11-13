'use client'

import React, { useState, useEffect } from 'react'
import { X, User, Lock, Phone, MapPin, Mail, KeyRound, ShoppingBag, LogOut, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { useCustomerStore } from '@/lib/customer-store'
import { api } from '@/lib/api'

interface CustomerProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomerProfileModal({ isOpen, onClose }: CustomerProfileModalProps) {
  const locale = useLocale()
  const { customer, setCustomerAuth, accessToken, logout } = useCustomerStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || '')
      setPhone(customer.phone || '')
      setAddress(customer.address || '')
    }
  }, [customer, isOpen])

  if (!isOpen || !customer) return null

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên')
      return
    }

    setIsSavingProfile(true)
    try {
      const updated = await api.customerUpdateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })

      if (accessToken) {
        setCustomerAuth({
          customer: {
            ...customer,
            fullName: updated.fullName || fullName,
            phone: updated.phone || phone,
            address: updated.address || address,
          },
          accessToken,
        })
      }

      toast.success('Đã cập nhật thông tin tài khoản thành công!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật thông tin lúc này')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!')
      return
    }

    setIsChangingPassword(true)
    try {
      await api.customerChangePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      })

      toast.success('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setActiveTab('profile')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đổi mật khẩu thất bại, vui lòng kiểm tra lại mật khẩu hiện tại')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword
  const isPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white border border-stone-200 shadow-2xl z-10 flex flex-col rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8C7E6A]/15 flex items-center justify-center text-[#4A4238] font-serif text-sm font-semibold border border-[#8C7E6A]/20">
              {customer.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[#3D332A] line-clamp-1">
                {customer.fullName || 'Tài khoản thành viên'}
              </h3>
              <p className="text-[11px] text-[#8C7E6A] font-light truncate max-w-[220px]">
                {customer.email || 'ƯƠM. Archive Member'}
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

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-[#4A4238] border-[#4A4238] bg-white font-semibold'
                : 'text-stone-400 hover:text-stone-600 border-transparent bg-stone-50 font-medium'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'text-[#4A4238] border-[#4A4238] bg-white font-semibold'
                : 'text-stone-400 hover:text-stone-600 border-transparent bg-stone-50 font-medium'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-xs"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={customer.email || 'Chưa liên kết email'}
                    className="w-full border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-500 pl-9 font-normal cursor-not-allowed rounded-xs"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 font-light">Email định danh tài khoản không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0988123456"
                    className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-xs"
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Địa chỉ giao hàng mặc định
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-xs"
                  />
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2.5 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-300 transition-colors uppercase tracking-[0.18em] text-xs font-semibold text-center shadow-xs mt-2 rounded-xs"
              >
                {isSavingProfile ? 'Đang lưu thay đổi...' : 'Lưu thông tin cá nhân'}
              </button>
            </form>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-xs"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  Nếu bạn đăng nhập bằng Facebook/Instagram lần đầu, có thể để trống ô này để tạo mật khẩu mới.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-xs"
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none transition-colors rounded-xs ${
                      isPasswordMismatch
                        ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                        : isPasswordMatch
                          ? 'border-emerald-500 focus:border-emerald-600'
                          : 'border-stone-200 focus:border-[#4A4238]'
                    }`}
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {isPasswordMismatch && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-500 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
                {isPasswordMatch && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Mật khẩu khớp
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || isPasswordMismatch}
                className="w-full py-2.5 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-300 transition-colors uppercase tracking-[0.18em] text-xs font-semibold text-center shadow-xs mt-2 rounded-xs"
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </form>
          )}

          {/* Quick Actions Footer inside modal */}
          <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between gap-3 text-xs">
            <Link
              href={`/${locale}/my-orders`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#4A4238] font-medium transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#8C7E6A]" />
              <span>Đơn hàng của tôi</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose()
                logout()
                toast.success('Đã đăng xuất tài khoản thành công')
              }}
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

