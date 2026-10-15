'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { getEffectiveApiBaseUrl } from '@/lib/api'

interface SocialLoginButtonsProps {
  className?: string
  onActionStart?: () => void
}

export const SocialLoginButtons = React.memo(function SocialLoginButtons({
  className = '',
  onActionStart,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'facebook' | 'instagram' | null>(null)

  const handleSocialLogin = (provider: 'facebook' | 'instagram') => {
    setLoadingProvider(provider)
    if (onActionStart) {
      onActionStart()
    }

    const apiBase = getEffectiveApiBaseUrl()
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
          <Image
            src="/assets/facebook-logo.webp"
            alt="Facebook"
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 object-contain transition-transform duration-200 group-hover:scale-110"
          />
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
          <Image
            src="/assets/instagram-logo.png"
            alt="Instagram"
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 rounded-[4px] object-contain transition-transform duration-200 group-hover:scale-110"
          />
        )}
        <span className="truncate tracking-wide">
          {loadingProvider === 'instagram' ? 'Đang chuyển hướng Instagram...' : 'Tiếp tục với Instagram'}
        </span>
      </button>
    </div>
  )
})
