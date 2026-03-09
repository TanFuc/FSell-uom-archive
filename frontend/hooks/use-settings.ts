'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type {
  AllSettings,
  ThemeSettings,
  SocialLinks,
  SiteContent,
  ExchangeRate,
  BrandingSettings,
} from '@/lib/types'

// ==================== BRANDING LOCALSTORAGE CACHE ====================
// Cho phép LoadingScreen đọc giá trị đồng bộ ngay khi mount,
// không cần chờ API fetch xong (tránh race condition).

const BRANDING_CACHE_KEY = 'uom_branding_cache'

function getBrandingFromStorage(): BrandingSettings | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const stored = localStorage.getItem(BRANDING_CACHE_KEY)
    return stored ? (JSON.parse(stored) as BrandingSettings) : undefined
  } catch {
    return undefined
  }
}

function saveBrandingToStorage(data: BrandingSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(data))
  } catch {}
}

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  theme: () => [...settingsKeys.all, 'theme'] as const,
  social: () => [...settingsKeys.all, 'social'] as const,
  exchange: () => [...settingsKeys.all, 'exchange'] as const,
  content: () => [...settingsKeys.all, 'content'] as const,
  branding: () => [...settingsKeys.all, 'branding'] as const,
}

// Get all settings
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiClient.getAllSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get theme settings
export function useTheme() {
  return useQuery({
    queryKey: settingsKeys.theme(),
    queryFn: () => apiClient.getTheme(),
    staleTime: 10 * 60 * 1000,
  })
}

// Get social links
export function useSocialLinks() {
  return useQuery({
    queryKey: settingsKeys.social(),
    queryFn: () => apiClient.getSocialLinks(),
    staleTime: 10 * 60 * 1000,
  })
}

// Get exchange rate
export function useExchangeRate() {
  return useQuery({
    queryKey: settingsKeys.exchange(),
    queryFn: () => apiClient.getExchangeRate(),
    staleTime: 5 * 60 * 1000, // 5 minutes (more frequent)
  })
}

// Get site content
export function useSiteContent() {
  return useQuery({
    queryKey: settingsKeys.content(),
    queryFn: () => apiClient.getSiteContent(),
    staleTime: 10 * 60 * 1000,
  })
}

// Update theme (Admin only)
export function useUpdateTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ThemeSettings>) => apiClient.updateTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.theme() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Theme updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update theme')
    },
  })
}

// Update social links (Admin only)
export function useUpdateSocialLinks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<SocialLinks>) => apiClient.updateSocialLinks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.social() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Social links updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update social links')
    },
  })
}

// Update exchange rate (Admin only)
export function useUpdateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rate: number) => apiClient.updateExchangeRate(rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.exchange() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Exchange rate updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update exchange rate')
    },
  })
}

// Update site content (Admin only)
export function useUpdateSiteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<SiteContent>) => apiClient.updateSiteContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.content() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Site content updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update site content')
    },
  })
}

// Get branding settings
// Dùng placeholderData từ localStorage để render ngay lập tức (sync),
// queryFn fetch API nền và lưu lại localStorage khi xong.
export function useBranding() {
  return useQuery({
    queryKey: settingsKeys.branding(),
    queryFn: async () => {
      const data = await apiClient.getBranding()
      saveBrandingToStorage(data)
      return data
    },
    staleTime: 10 * 60 * 1000,
    // Hiện giá trị localStorage ngay, không chờ fetch
    placeholderData: getBrandingFromStorage,
  })
}

// Update branding (Admin/Manager only)
export function useUpdateBranding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<BrandingSettings>) => apiClient.updateBranding(data),
    onSuccess: (updatedBranding) => {
      // Lưu ngay vào localStorage để lần sau LoadingScreen đọc được giá trị mới
      saveBrandingToStorage(updatedBranding)
      queryClient.invalidateQueries({ queryKey: settingsKeys.branding() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.content() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      toast.success('Branding updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update branding')
    },
  })
}
