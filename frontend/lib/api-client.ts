import axios, { type AxiosInstance, type AxiosError } from 'axios'
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
  BrandingSettings,
  User,
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  BulkDeleteDto,
  BulkUpdateDto,
  Banner,
} from './types'

// Auth types
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      timeout: 30000,
    })

    // Request interceptor
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
      (error) => Promise.reject(error),
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data.data || response.data,
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
              { headers: { Authorization: `Bearer ${refreshToken}` } },
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
      },
    )
  }

  // ==================== AUTH ====================
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await this.client.post<any, AuthResponse>('/auth/register', data)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
    }
    return response
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.client.post<any, AuthResponse>('/auth/login', data)
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
    }
    return response
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
  }

  async getProfile(): Promise<User> {
    return this.client.get('/auth/profile')
  }

  // ==================== PRODUCTS (PUBLIC) ====================
  async getProducts(params?: QueryProductsDto): Promise<PaginatedResponse<Product>> {
    return this.client.get('/products', { params })
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.client.get(`/products/${slug}`)
  }

  // ==================== PRODUCTS (ADMIN) ====================
  async getAdminProducts(params?: QueryProductsDto): Promise<PaginatedResponse<Product>> {
    return this.client.get('/products/admin/list', { params })
  }

  async getProductById(id: string): Promise<Product> {
    return this.client.get(`/products/admin/id/${id}`)
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.client.post('/products', data)
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    return this.client.put(`/products/${id}`, data)
  }

  async softDeleteProduct(id: string): Promise<void> {
    return this.client.delete(`/products/${id}`)
  }

  async hardDeleteProduct(id: string): Promise<void> {
    return this.client.delete(`/products/${id}/permanent`)
  }

  async restoreProduct(id: string): Promise<Product> {
    return this.client.post(`/products/${id}/restore`)
  }

  async duplicateProduct(id: string): Promise<Product> {
    return this.client.post(`/products/${id}/duplicate`)
  }

  async bulkDeleteProducts(data: BulkDeleteDto): Promise<{ deletedCount: number }> {
    return this.client.post('/products/bulk/delete', data)
  }

  async bulkUpdateProducts(data: BulkUpdateDto): Promise<{ updatedCount: number }> {
    return this.client.patch('/products/bulk/update', data)
  }

  async bulkRestoreProducts(ids: string[]): Promise<{ restoredCount: number }> {
    return this.client.post('/products/bulk/restore', { ids })
  }

  // ==================== SETTINGS ====================
  async getAllSettings(): Promise<AllSettings> {
    return this.client.get('/settings')
  }

  async getTheme(): Promise<ThemeSettings> {
    return this.client.get('/settings/theme')
  }

  async updateTheme(data: Partial<ThemeSettings>): Promise<ThemeSettings> {
    return this.client.put('/settings/theme', data)
  }

  async getSiteContent(): Promise<SiteContent> {
    return this.client.get('/settings/site-content')
  }

  async updateSiteContent(data: Partial<SiteContent>): Promise<SiteContent> {
    return this.client.put('/settings/site-content', data)
  }

  async getSocialLinks(): Promise<SocialLinks> {
    return this.client.get('/settings/social-links')
  }

  async updateSocialLinks(data: Partial<SocialLinks>): Promise<SocialLinks> {
    return this.client.put('/settings/social-links', data)
  }

  async getExchangeRate(): Promise<ExchangeRate> {
    return this.client.get('/settings/exchange-rate')
  }

  async updateExchangeRate(rate: number): Promise<ExchangeRate> {
    return this.client.put('/settings/exchange-rate', { rate })
  }

  async getBranding(): Promise<BrandingSettings> {
    return this.client.get('/settings/branding')
  }

  async updateBranding(data: Partial<BrandingSettings>): Promise<BrandingSettings> {
    return this.client.put('/settings/branding', data)
  }

  // ==================== USERS (ADMIN) ====================
  async getUsers(params?: QueryUsersDto): Promise<PaginatedResponse<User>> {
    return this.client.get('/users', { params })
  }

  async getUserById(id: string): Promise<User> {
    return this.client.get(`/users/${id}`)
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.client.post('/users', data)
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return this.client.put(`/users/${id}`, data)
  }

  async softDeleteUser(id: string): Promise<void> {
    return this.client.delete(`/users/${id}`)
  }

  async restoreUser(id: string): Promise<User> {
    return this.client.post(`/users/${id}/restore`)
  }

  // ==================== BANNERS (PUBLIC & ADMIN) ====================
  async getBanners(activeOnly = true): Promise<Banner[]> {
    return this.client.get('/banners', { params: { activeOnly: activeOnly.toString() } })
  }

  async getBannerById(id: string): Promise<Banner> {
    return this.client.get(`/banners/${id}`)
  }

  async createBanner(data: any): Promise<Banner> {
    return this.client.post('/banners', data)
  }

  async updateBanner(id: string, data: any): Promise<Banner> {
    return this.client.patch(`/banners/${id}`, data)
  }

  async deleteBanner(id: string): Promise<void> {
    return this.client.delete(`/banners/${id}`)
  }

  // ==================== UPLOAD (ADMIN) ====================
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return this.client.post('/upload/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async uploadImages(files: File[]): Promise<{ urls: string[] }> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return this.client.post('/upload/product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async deleteFile(url: string): Promise<void> {
    return this.client.delete('/upload/file', { data: { url } })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
