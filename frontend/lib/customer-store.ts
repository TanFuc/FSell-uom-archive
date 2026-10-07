import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomerUser {
  id: string
  email: string
  fullName: string
  phone?: string | null
  address?: string | null
}

interface CustomerAuthState {
  customer: CustomerUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  authModalMessage?: string
  postLoginAction?: (() => void) | null

  setCustomerAuth: (data: { customer: CustomerUser; accessToken: string; refreshToken?: string }) => void
  logout: () => void
  openAuthModal: (message?: string, postAction?: () => void) => void
  closeAuthModal: () => void
}

export const useCustomerStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      authModalMessage: undefined,
      postLoginAction: null,

      setCustomerAuth: ({ customer, accessToken, refreshToken }) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('customerAccessToken', accessToken)
          if (refreshToken) {
            localStorage.setItem('customerRefreshToken', refreshToken)
          }
        }
        set({
          customer,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isAuthModalOpen: false,
        })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('customerAccessToken')
          localStorage.removeItem('customerRefreshToken')
        }
        set({
          customer: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      openAuthModal: (message, postAction) => {
        set({
          isAuthModalOpen: true,
          authModalMessage: message || 'Vui lòng đăng nhập để tiếp tục',
          postLoginAction: postAction || null,
        })
      },

      closeAuthModal: () => {
        set({
          isAuthModalOpen: false,
          authModalMessage: undefined,
          postLoginAction: null,
        })
      },
    }),
    {
      name: 'uom-customer-auth',
      partialize: (state) => ({
        customer: state.customer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
