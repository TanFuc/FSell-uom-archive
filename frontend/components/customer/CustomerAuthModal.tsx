'use client'

import React, { useState } from 'react'
import { X, Lock, Mail, User, Phone, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerStore } from '@/lib/customer-store'
import { api } from '@/lib/api'

export function CustomerAuthModal() {
  const {
    isAuthModalOpen,
    authModalMessage,
    closeAuthModal,
    setCustomerAuth,
    postLoginAction,
  } = useCustomerStore()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  if (!isAuthModalOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setLoading(true)
    try {
      const res = await api.customerLogin({
        email: loginEmail,
        password: loginPassword,
      })

      const payload = res?.data || res
      setCustomerAuth({
        customer: payload.customer,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      })

      toast.success(`Chào mừng trở lại, ${payload.customer?.fullName || 'bạn'}!`)
      closeAuthModal()

      if (postLoginAction) {
        postLoginAction()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email hoặc mật khẩu không chính xác')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regEmail || !regPassword || !regFullName) {
      toast.error('Vui lòng điền đầy đủ họ tên, email và mật khẩu')
      return
    }

    if (regPassword.length < 6) {
      toast.error('Mật khẩu phải có tối thiểu 6 ký tự')
      return
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!')
      return
    }

    setLoading(true)
    try {
      const res = await api.customerRegister({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phone: regPhone || undefined,
      })

      const payload = res?.data || res
      setCustomerAuth({
        customer: payload.customer,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      })

      toast.success('Đăng ký tài khoản thành công!')
      closeAuthModal()

      if (postLoginAction) {
        postLoginAction()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  const isPasswordMatch = regPassword.length > 0 && regPassword === regConfirmPassword
  const isPasswordMismatch = regConfirmPassword.length > 0 && regPassword !== regConfirmPassword

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white border border-stone-200 shadow-2xl z-10 overflow-hidden rounded-sm transition-all duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div>
            <h3 className="font-sans text-sm sm:text-base uppercase tracking-[0.15em] font-semibold text-[#4A4238]">
              {tab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên'}
            </h3>
            <p className="text-[11px] text-[#8C7E6A] mt-0.5 font-serif italic">ƯƠM. Archive Member</p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1 -mr-1 text-stone-400 hover:text-[#4A4238] transition-colors rounded"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert */}
        {authModalMessage && (
          <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center gap-2 text-xs text-[#8C7E6A]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8C7E6A]" />
            <span className="font-normal">{authModalMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] border-b-2 transition-all duration-150 ${
              tab === 'login'
                ? 'text-[#4A4238] border-[#4A4238] bg-white font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-600 border-transparent bg-stone-50 font-medium'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] border-b-2 transition-all duration-150 ${
              tab === 'register'
                ? 'text-[#4A4238] border-[#4A4238] bg-white font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-600 border-transparent bg-stone-50 font-medium'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Tab 1: Login Form */}
        <form
          onSubmit={handleLogin}
          className={`p-6 space-y-4 ${tab === 'login' ? 'block' : 'hidden'}`}
        >
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1.5 font-semibold">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-400 transition-colors uppercase tracking-[0.2em] text-xs font-semibold text-center shadow-sm mt-2 rounded-sm"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập & Tiếp tục'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setTab('register')}
              className="text-xs text-[#8C7E6A] hover:text-[#4A4238] uppercase tracking-wider font-semibold transition-colors"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </form>

        {/* Tab 2: Register Form */}
        <form
          onSubmit={handleRegister}
          className={`p-6 space-y-3.5 ${tab === 'register' ? 'block' : 'hidden'}`}
        >
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1 font-semibold">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1 font-semibold">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1 font-semibold">
              Số điện thoại
            </label>
            <div className="relative">
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0988123456"
                className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1 font-semibold">
              Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none focus:border-[#4A4238] transition-colors rounded-sm"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#4A4238] mb-1 font-semibold">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showRegConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 pr-10 font-normal focus:outline-none transition-colors rounded-sm ${
                  isPasswordMismatch
                    ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                    : isPasswordMatch
                      ? 'border-emerald-500 focus:border-emerald-600'
                      : 'border-stone-200 focus:border-[#4A4238]'
                }`}
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 transition-colors p-0.5"
                title={showRegConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Real-time mismatch / match message */}
            {isPasswordMismatch && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu xác nhận không khớp
              </p>
            )}
            {isPasswordMatch && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu khớp
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isPasswordMismatch}
            className="w-full py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors uppercase tracking-[0.2em] text-xs font-semibold text-center shadow-sm mt-3 rounded-sm"
          >
            {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản & Tiếp tục'}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className="text-xs text-[#8C7E6A] hover:text-[#4A4238] uppercase tracking-wider font-semibold transition-colors"
            >
              Đã có tài khoản? Đăng nhập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
