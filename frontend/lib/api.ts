import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  PaginatedResponse,
  ThemeSettings,
  SocialLinks,
  SiteContent,
  ExchangeRate,
  AllSettings,
  AuthResponse,
  LoginDto,
  RegisterDto,
  User,
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  BulkDeleteDto,
  BulkUpdateDto,
  UpdateThemeDto,
  UpdateSiteContentDto,
  UpdateSocialLinksDto,
  UpdateExchangeRateDto,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }

          const locale = localStorage.getItem('locale') || 'vi'
          config.headers['Accept-Language'] = locale
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const originalRequest: any = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) throw new Error('No refresh token')

            const { data } = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: { Authorization: `Bearer ${refreshToken}` },
              }
            )

            localStorage.setItem('accessToken', data.data.accessToken)
            localStorage.setItem('refreshToken', data.data.refreshToken)

            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
            return this.client(originalRequest)
          } catch (refreshError) {
            localStorage.clear()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // ==================== PUBLIC ENDPOINTS ====================

  async getProducts(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(
      `/products${query ? `?${query}` : ''}`
    )
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.request<Product>(`/products/${slug}`)
  }

  async getTheme(): Promise<ThemeSettings> {
    return this.request<ThemeSettings>('/settings/theme')
  }

  async getSiteContent(): Promise<SiteContent> {
    return this.request<SiteContent>('/settings/site-content')
  }

  async getSocialLinks(): Promise<SocialLinks> {
    return this.request<SocialLinks>('/settings/social-links')
  }

  async getExchangeRate(): Promise<ExchangeRate> {
    return this.request<ExchangeRate>('/settings/exchange-rate')
  }

  async getAllSettings(): Promise<AllSettings> {
    return this.request<AllSettings>('/settings')
  }

  // ==================== AUTH ENDPOINTS ====================

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
    }

    return response
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me')
  }

  // ==================== ADMIN PRODUCT ENDPOINTS ====================

  async getAdminProducts(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    includeDeleted?: boolean
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.isActive !== undefined)
      searchParams.set('isActive', params.isActive.toString())
    if (params?.includeDeleted !== undefined)
      searchParams.set('includeDeleted', params.includeDeleted.toString())

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(
      `/products/admin/list${query ? `?${query}` : ''}`
    )
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/admin/id/${id}`)
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  async restoreProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}/restore`, {
      method: 'POST',
    })
  }

  async duplicateProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}/duplicate`, {
      method: 'POST',
    })
  }

  async hardDeleteProduct(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/products/${id}/permanent`, {
      method: 'DELETE',
    })
  }

  // ==================== ADMIN SETTINGS ENDPOINTS ====================

  async updateTheme(data: Partial<ThemeSettings>): Promise<ThemeSettings> {
    return this.request<ThemeSettings>('/settings/theme', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateSocialLinks(data: Partial<SocialLinks>): Promise<SocialLinks> {
    return this.request<SocialLinks>('/settings/social-links', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateSiteContent(data: SiteContent): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateExchangeRate(rate: number): Promise<ExchangeRate> {
    return this.request<ExchangeRate>('/settings/exchange-rate', {
      method: 'PUT',
      body: JSON.stringify({ rate }),
    })
  }

  // ==================== ADMIN USER ENDPOINTS ====================

  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    includeDeleted?: boolean
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.includeDeleted !== undefined)
      searchParams.set('includeDeleted', params.includeDeleted.toString())

    const query = searchParams.toString()
    return this.request<PaginatedResponse<User>>(
      `/users${query ? `?${query}` : ''}`
    )
  }

  async createUser(data: {
    email: string
    password: string
    fullName: string
    role: 'ADMIN' | 'MANAGER'
  }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(
    id: string,
    data: Partial<User & { password?: string }>
  ): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  async restoreUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}/restore`, {
      method: 'POST',
    })
  }

  // ==================== UPLOAD ENDPOINT ====================

  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const token = this.getToken()
    const headers: HeadersInit = {}

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }
}

export const api = new ApiClient(API_BASE_URL)
