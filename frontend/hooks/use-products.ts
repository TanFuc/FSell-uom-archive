'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type {
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  BulkDeleteDto,
  BulkUpdateDto,
} from '@/lib/types'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: QueryProductsDto) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  detailById: (id: string) => [...productKeys.details(), 'id', id] as const,
}

export function useProducts(params?: QueryProductsDto, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: () => {
      if (params?.includeDeleted) {
        return apiClient.getAdminProducts(params)
      }
      return apiClient.getProducts(params)
    },
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => apiClient.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: productKeys.detailById(id),
    queryFn: () => apiClient.getProductById(id),
    enabled: !!id && id !== 'new',
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductDto) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Product created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product')
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      apiClient.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detailById(variables.id) })
      toast.success('Product updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product')
    },
  })
}

export function useSoftDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.softDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Product deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete product')
    },
  })
}

export function useHardDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.hardDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Product permanently deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to permanently delete product')
    },
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Product restored')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore product')
    },
  })
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success('Product duplicated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate product')
    },
  })
}

export function useBulkSoftDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkDeleteDto) => apiClient.bulkDeleteProducts(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success(`${response.deletedCount} products deleted`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete products')
    },
  })
}

export function useBulkHardDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkDeleteDto) => {
      await Promise.all(data.ids.map((id) => apiClient.hardDeleteProduct(id)))
      return { deletedCount: data.ids.length }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success(`${response.deletedCount} products permanently deleted`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to permanently delete products')
    },
  })
}

export function useBulkRestore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkRestoreProducts(ids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success(`${response.restoredCount} products restored`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore products')
    },
  })
}

export function useBulkUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkUpdateDto) => apiClient.bulkUpdateProducts(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      toast.success(`${response.updatedCount} products updated`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update products')
    },
  })
}
