'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => apiClient.uploadImage(file),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image')
    },
  })
}

export function useUploadImages() {
  return useMutation({
    mutationFn: (files: File[]) => apiClient.uploadImages(files),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload images')
    },
  })
}
