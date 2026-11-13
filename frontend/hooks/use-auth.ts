'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/lib/types'

interface LoginDto {
  email: string
  password: string
}

interface RegisterDto {
  email: string
  password: string
  fullName: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => apiClient.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginDto) => apiClient.login(data),
    onSuccess: (response: AuthResponse) => {
      queryClient.setQueryData(authKeys.profile(), response.user)
      toast.success('Đăng nhập thành công')

      if (response.user.role === 'ADMIN' || response.user.role === 'MANAGER') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại')
    },
  })
}

export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterDto) => apiClient.register(data),
    onSuccess: (response: AuthResponse) => {
      queryClient.setQueryData(authKeys.profile(), response.user)
      toast.success('Đăng ký thành công')
      router.push('/')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại')
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear()
      toast.success('Đăng xuất thành công')
      router.push('/')
    },
    onError: (error: any) => {
      queryClient.clear()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/')
      toast.error(error.message || 'Đăng xuất thất bại')
    },
  })
}

export function useIsAuthenticated() {
  const { data: user, isLoading } = useProfile()
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  }
}

export function useHasRole(role: 'ADMIN' | 'MANAGER' | 'USER') {
  const { user } = useIsAuthenticated()
  return user?.role === role
}

export function useIsAdmin() {
  const { user } = useIsAuthenticated()
  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}
