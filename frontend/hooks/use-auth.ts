'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { LoginDto, RegisterDto, AuthResponse, User } from '@/lib/types'
import { toast } from 'sonner'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => apiClient.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

// Login mutation
export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginDto) => apiClient.login(data),
    onSuccess: (response: AuthResponse) => {
      // Tokens are already saved by apiClient
      queryClient.setQueryData(authKeys.profile(), response.user)
      toast.success('Đăng nhập thành công')
      
      // Redirect based on role
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

// Register mutation
export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterDto) => apiClient.register(data),
    onSuccess: (response: AuthResponse) => {
      // Tokens are already saved by apiClient
      queryClient.setQueryData(authKeys.profile(), response.user)
      toast.success('Đăng ký thành công')
      router.push('/')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại')
    },
  })
}

// Logout mutation
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear()
      toast.success('Đăng xuất thành công')
      router.push('/')
    },
    onError: (error: any) => {
      // Even if API call fails, clear local data
      queryClient.clear()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/')
      toast.error(error.message || 'Đăng xuất thất bại')
    },
  })
}

// Refresh token mutation (usually automatic via interceptor)
export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.refreshAccessToken(),
    onSuccess: (response: AuthResponse) => {
      queryClient.setQueryData(authKeys.profile(), response.user)
    },
    onError: () => {
      // Clear tokens and redirect to login
      queryClient.clear()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    },
  })
}

// Check if user is authenticated
export function useIsAuthenticated() {
  const { data: user, isLoading } = useProfile()
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  }
}

// Check if user has specific role
export function useHasRole(role: 'ADMIN' | 'MANAGER' | 'USER') {
  const { user } = useIsAuthenticated()
  return user?.role === role
}

// Check if user is admin or manager
export function useIsAdmin() {
  const { user } = useIsAuthenticated()
  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}
