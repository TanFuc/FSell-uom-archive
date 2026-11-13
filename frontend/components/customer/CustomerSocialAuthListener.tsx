'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useCustomerStore } from '@/lib/customer-store'
import { api } from '@/lib/api'

function SocialAuthHandler() {
  const searchParams = useSearchParams()
  const { setCustomerAuth, postLoginAction } = useCustomerStore()

  useEffect(() => {
    if (!searchParams) return

    const customerToken = searchParams.get('customer_token') || searchParams.get('token')
    const customerRefreshToken =
      searchParams.get('customer_refresh_token') || searchParams.get('refreshToken') || undefined
    const socialProvider = searchParams.get('social_login')
    const customerName = searchParams.get('customer_name')
    const authError = searchParams.get('auth_error')

    // 1. Xử lý lỗi trả về từ OAuth (hủy đăng nhập hoặc lỗi hệ thống)
    if (authError) {
      toast.error(decodeURIComponent(authError), { duration: 4000 })
      cleanUrl()
      return
    }

    // 2. Xử lý khi nhận được Token thành công
    if (customerToken) {
      // Lưu token tạm vào localStorage để API client tự động gửi kèm Authorization header
      if (typeof window !== 'undefined') {
        localStorage.setItem('customerAccessToken', customerToken)
        if (customerRefreshToken) {
          localStorage.setItem('customerRefreshToken', customerRefreshToken)
        }
      }

      // Lấy thông tin chi tiết khách hàng từ backend
      api
        .customerGetMe()
        .then((customerProfile) => {
          setCustomerAuth({
            customer: customerProfile,
            accessToken: customerToken,
            refreshToken: customerRefreshToken,
          })

          const providerLabel =
            socialProvider === 'facebook'
              ? 'Facebook'
              : socialProvider === 'instagram'
              ? 'Instagram'
              : 'mạng xã hội'

          toast.success(
            `Đăng nhập thành công qua ${providerLabel}! Chào mừng ${customerProfile.fullName || 'bạn'}.`,
            { duration: 3000 },
          )

          cleanUrl()

          // Kích hoạt hành động chờ sau khi đăng nhập (nếu có, ví dụ: Thêm vào giỏ hàng)
          if (postLoginAction) {
            postLoginAction()
          }
        })
        .catch((err) => {
          console.error('Lỗi khi lấy thông tin khách hàng sau OAuth:', err)
          // Fallback profile nếu mạng chập chờn
          const fallbackCustomer = {
            id: 'social_user',
            email: null,
            fullName: customerName ? decodeURIComponent(customerName) : 'Khách hàng',
          }
          setCustomerAuth({
            customer: fallbackCustomer,
            accessToken: customerToken,
            refreshToken: customerRefreshToken,
          })
          toast.success('Đăng nhập thành công!', { duration: 2500 })
          cleanUrl()
        })
    }

    function cleanUrl() {
      if (typeof window === 'undefined') return

      const url = new URL(window.location.href)
      url.searchParams.delete('customer_token')
      url.searchParams.delete('token')
      url.searchParams.delete('customer_refresh_token')
      url.searchParams.delete('refreshToken')
      url.searchParams.delete('social_login')
      url.searchParams.delete('customer_name')
      url.searchParams.delete('auth_error')

      const newUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [searchParams])

  return null
}

export function CustomerSocialAuthListener() {
  return (
    <Suspense fallback={null}>
      <SocialAuthHandler />
    </Suspense>
  )
}
