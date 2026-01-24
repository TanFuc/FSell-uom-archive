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
} from '@/lib/types'

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  theme: () => [...settingsKeys.all, 'theme'] as const,
  social: () => [...settingsKeys.all, 'social'] as const,
  exchange: () => [...settingsKeys.all, 'exchange'] as const,
  content: () => [...settingsKeys.all, 'content'] as const,
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
