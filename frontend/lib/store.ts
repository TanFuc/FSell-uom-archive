import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, ThemeSettings } from './types'
import { DEFAULT_THEME } from './constants'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

interface ThemeState {
  theme: ThemeSettings
  setTheme: (theme: ThemeSettings) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: DEFAULT_THEME,
  setTheme: (theme) => set({ theme }),
}))

interface SettingsState {
  exchangeRate: number
  setExchangeRate: (rate: number) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  exchangeRate: 25000,
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
}))
