'use client'

import React, { useState } from 'react'

interface SocialLoginButtonsProps {
  className?: string
  onActionStart?: () => void
}

export function SocialLoginButtons({ className = '', onActionStart }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'facebook' | 'instagram' | null>(null)

  const handleSocialLogin = (provider: 'facebook' | 'instagram') => {
    setLoadingProvider(provider)
    if (onActionStart) {
      onActionStart()
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3006'
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''

    const targetUrl = `${apiBase}/customer/auth/${provider}?origin=${encodeURIComponent(currentOrigin)}`
    window.location.href = targetUrl
  }

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* Nút Đăng nhập Facebook */}
      <button
        type="button"
        disabled={loadingProvider !== null}
        onClick={() => handleSocialLogin('facebook')}
        className="group relative flex w-full items-center justify-center gap-3 rounded-none border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-[#4A4238] transition-all duration-200 hover:border-[#1877F2]/60 hover:bg-stone-50/60 hover:shadow-xs active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        title="Tiếp tục với Facebook"
      >
        {loadingProvider === 'facebook' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="#1877F2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        <span className="truncate tracking-wide">
          {loadingProvider === 'facebook' ? 'Đang chuyển hướng Facebook...' : 'Tiếp tục với Facebook'}
        </span>
      </button>

      {/* Nút Đăng nhập Instagram */}
      <button
        type="button"
        disabled={loadingProvider !== null}
        onClick={() => handleSocialLogin('instagram')}
        className="group relative flex w-full items-center justify-center gap-3 rounded-none border border-stone-200 bg-white px-4 py-2.5 text-xs font-medium text-[#4A4238] transition-all duration-200 hover:border-[#E1306C]/60 hover:bg-stone-50/60 hover:shadow-xs active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        title="Tiếp tục với Instagram"
      >
        {loadingProvider === 'instagram' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E1306C] border-t-transparent" />
        ) : (
          <svg
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="ig-grad" r="150%" cx="30%" cy="107%">
                <stop stopColor="#fdf497" offset="0%" />
                <stop stopColor="#fdf497" offset="5%" />
                <stop stopColor="#fd5949" offset="45%" />
                <stop stopColor="#d6249f" offset="60%" />
                <stop stopColor="#285AEB" offset="90%" />
              </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
            <path
              d="M12 6.5C8.96 6.5 6.5 8.96 6.5 12C6.5 15.04 8.96 17.5 12 17.5C15.04 17.5 17.5 15.04 17.5 12C17.5 8.96 15.04 6.5 12 6.5ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5ZM16.88 7.82C16.88 8.24 16.54 8.58 16.12 8.58C15.7 8.58 15.36 8.24 15.36 7.82C15.36 7.4 15.7 7.06 16.12 7.06C16.54 7.06 16.88 7.4 16.88 7.82Z"
              fill="white"
            />
          </svg>
        )}
        <span className="truncate tracking-wide">
          {loadingProvider === 'instagram' ? 'Đang chuyển hướng Instagram...' : 'Tiếp tục với Instagram'}
        </span>
      </button>
    </div>
  )
}
