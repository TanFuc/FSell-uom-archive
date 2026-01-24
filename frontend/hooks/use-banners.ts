'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Banner } from '@/lib/types'

// Query keys for cache management
export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (activeOnly: boolean) => [...bannerKeys.lists(), { activeOnly }] as const,
  details: () => [...bannerKeys.all, 'detail'] as const,
  detail: (id: string) => [...bannerKeys.details(), id] as const,
}

// Public: Get active banners
export function useBanners(activeOnly = true) {
  return useQuery({
    queryKey: bannerKeys.list(activeOnly),
    queryFn: () => apiClient.getBanners(activeOnly),
    staleTime: 10 * 60 * 1000, // 10 minutes - banners don't change often
  })
}

// Public: Get single banner by ID
export function useBanner(id: string) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => apiClient.getBannerById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Mutations
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiClient.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useUpdateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useDeleteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}
