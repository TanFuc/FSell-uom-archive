'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

// Upload single image
export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => apiClient.uploadImage(file),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image')
    },
  })
}

// Upload multiple images
export function useUploadImages() {
  return useMutation({
    mutationFn: (files: File[]) => apiClient.uploadImages(files),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload images')
    },
  })
}

// Delete image
export function useDeleteImage() {
  return useMutation({
    mutationFn: (url: string) => apiClient.deleteImage(url),
    onSuccess: () => {
      toast.success('Image deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete image')
    },
  })
}
