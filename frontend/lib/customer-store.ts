import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomerUser {
  id: string
  email: string | null
  fullName: string
  phone?: string | null
  address?: string | null
  avatarUrl?: string | null
  authProvider?: string | null
}

interface CustomerAuthState {
  customer: CustomerUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  authModalMessage?: string
  postLoginAction?: (() => void) | null
  cartCount: number

  setCustomerAuth: (data: { customer: CustomerUser; accessToken: string; refreshToken?: string }) => void
  logout: () => void
  openAuthModal: (message?: string, postAction?: () => void) => void
  closeAuthModal: () => void
  setCartCount: (count: number) => void
  fetchCartCount: () => Promise<void>
}

export const useCustomerStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      authModalMessage: undefined,
      postLoginAction: null,
      cartCount: 0,

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
        get().fetchCartCount()
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
          cartCount: 0,
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

      setCartCount: (count: number) => {
        set({ cartCount: Math.max(0, count) })
      },

      fetchCartCount: async () => {
        if (!get().isAuthenticated) {
          set({ cartCount: 0 })
          return
        }
        try {
          const { api } = await import('@/lib/api')
          const cart = await api.getCart()
          const totalQty = (cart?.items || []).reduce(
            (sum: number, item: any) => sum + (item.quantity || 1),
            0,
          )
          set({ cartCount: totalQty })
        } catch {
          // ignore error
        }
      },
    }),
    {
      name: 'uom-customer-auth',
      partialize: (state) => ({
        customer: state.customer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        cartCount: state.cartCount,
      }),
    },
  ),
)
