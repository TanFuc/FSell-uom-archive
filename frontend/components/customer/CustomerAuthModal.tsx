'use client'

import React, { useState } from 'react'
import { X, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerStore } from '@/lib/customer-store'
import { api } from '@/lib/api'
import { SocialLoginButtons } from './SocialLoginButtons'

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

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')

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

      // Execute queued action (e.g. Add to Cart)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-stone-200 shadow-[0_20px_50px_rgba(74,66,56,0.15)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div>
            <h3 className="font-serif text-sm uppercase tracking-[0.2em] font-semibold text-[#4A4238]">
              {tab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên'}
            </h3>
            <p className="text-[11px] text-[#8C7E6A] mt-0.5">ƯƠM. Archive Member</p>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 -mr-1 text-stone-400 hover:text-[#4A4238] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert */}
        {authModalMessage && (
          <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center gap-2 text-xs text-[#8C7E6A]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{authModalMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] font-medium transition-all ${
              tab === 'login'
                ? 'text-[#4A4238] border-b-2 border-[#4A4238] font-semibold bg-white'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs uppercase tracking-[0.15em] font-medium transition-all ${
              tab === 'register'
                ? 'text-[#4A4238] border-b-2 border-[#4A4238] font-semibold bg-white'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Tab 1: Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-400 transition-colors uppercase tracking-[0.2em] text-xs font-medium text-center shadow-sm mt-2"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập & Tiếp tục'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setTab('register')}
                className="text-[11px] text-[#8C7E6A] hover:underline uppercase tracking-wider"
              >
                Chưa có tài khoản? Đăng ký ngay
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Họ và tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Số điện thoại
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0988123456"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-medium">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-stone-200 bg-white px-3.5 py-2 text-xs text-[#4A4238] pl-9 focus:outline-none focus:border-[#4A4238] transition-colors"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#4A4238] text-white hover:bg-[#8C7E6A] disabled:bg-stone-400 transition-colors uppercase tracking-[0.2em] text-xs font-medium text-center shadow-sm mt-3"
            >
              {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản & Tiếp tục'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-[11px] text-[#8C7E6A] hover:underline uppercase tracking-wider"
              >
                Đã có tài khoản? Đăng nhập ngay
              </button>
            </div>
          </form>
        )}

        {/* Hoặc tiếp tục với mạng xã hội (Facebook / Instagram) */}
        <div className="px-6 pb-6 pt-0">
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-stone-200" />
            <span className="absolute bg-white px-3 font-mono text-[9px] uppercase tracking-widest text-stone-400">
              Hoặc tiếp tục với
            </span>
          </div>

          <SocialLoginButtons />
        </div>
      </div>
    </div>
  )
}
