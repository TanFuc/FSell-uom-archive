'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { ThemeSettings, SocialLinks, SiteContent, BrandingSettings } from '@/lib/types'

const BRANDING_CACHE_KEY = 'uom_branding_cache'

function isLegacyBrandingCache(data: Partial<BrandingSettings>): boolean {
  return [
    data.brandNameVi,
    data.brandNameEn,
    data.loadingText,
    data.brandTaglineVi,
    data.brandTaglineEn,
  ].some((value) => typeof value === 'string' && (value.includes('UOM.') || value.includes('Æ')))
}

function getBrandingFromStorage(): BrandingSettings | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const stored = localStorage.getItem(BRANDING_CACHE_KEY)
    if (!stored) return undefined
    const parsed = JSON.parse(stored) as BrandingSettings
    if (isLegacyBrandingCache(parsed)) {
      localStorage.removeItem(BRANDING_CACHE_KEY)
      return undefined
    }
    return parsed
  } catch {
    return undefined
  }
}

void getBrandingFromStorage

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
  enabled?: boolean
}

type SettingsQueryOptions<TData = any> = {
  enabled?: boolean
  initialData?: TData
  staleTime?: number
  refetchOnMount?: boolean | 'always'
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

export function useSocialLinks(options?: SettingsQueryOptions<SocialLinks>) {
  return useQuery({
    queryKey: settingsKeys.social(),
    queryFn: () => apiClient.getSocialLinks(),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? 0 : undefined,
    staleTime: options?.staleTime ?? 15 * 1000,
    refetchOnMount: options?.refetchOnMount ?? true,
  })
}

export function useExchangeRate(options?: SettingsQueryOptions) {
  return useQuery({
    queryKey: settingsKeys.exchange(),
    queryFn: () => apiClient.getExchangeRate(),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? 0 : undefined,
    staleTime: options?.staleTime ?? 15 * 1000,
    refetchOnMount: options?.refetchOnMount ?? true,
  })
}

export function useSiteContent(options?: SiteContentQueryOptions) {
  return useQuery({
    queryKey: settingsKeys.content(),
    queryFn: () => apiClient.getSiteContent(),
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? 0 : undefined,
    staleTime: options?.staleTime ?? 15 * 1000,
    refetchOnMount: options?.refetchOnMount ?? true,
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
    staleTime: 15 * 1000,
    refetchOnMount: true,
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
