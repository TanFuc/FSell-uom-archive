'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { ThemeSettings, SocialLinks, SiteContent, BrandingSettings } from '@/lib/types'

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

export const settingsKeys = {
  all: ['settings'] as const,
  theme: () => [...settingsKeys.all, 'theme'] as const,
  social: () => [...settingsKeys.all, 'social'] as const,
  exchange: () => [...settingsKeys.all, 'exchange'] as const,
  content: () => [...settingsKeys.all, 'content'] as const,
  branding: () => [...settingsKeys.all, 'branding'] as const,
}

type SiteContentQueryOptions = {
  staleTime?: number
  refetchOnMount?: boolean | 'always'
  initialData?: any
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiClient.getAllSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useTheme() {
  return useQuery({
    queryKey: settingsKeys.theme(),
    queryFn: () => apiClient.getTheme(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSocialLinks() {
  return useQuery({
    queryKey: settingsKeys.social(),
    queryFn: () => apiClient.getSocialLinks(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useExchangeRate() {
  return useQuery({
    queryKey: settingsKeys.exchange(),
    queryFn: () => apiClient.getExchangeRate(),
    staleTime: 5 * 60 * 1000, // 5 minutes (more frequent)
  })
}

export function useSiteContent(options?: SiteContentQueryOptions) {
  return useQuery({
    queryKey: settingsKeys.content(),
    queryFn: () => apiClient.getSiteContent(),
    staleTime: options?.staleTime ?? 10 * 60 * 1000,
    refetchOnMount: options?.refetchOnMount,
    initialData: options?.initialData,
  })
}

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

export function useBranding() {
  return useQuery({
    queryKey: settingsKeys.branding(),
    queryFn: async () => {
      const data = await apiClient.getBranding()
      saveBrandingToStorage(data)
      return data
    },
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,

    placeholderData: getBrandingFromStorage,
  })
}

export function useUpdateBranding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<BrandingSettings>) => apiClient.updateBranding(data),
    onSuccess: (updatedBranding) => {
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
