import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { pingProductSeo, pingSitewideSeo, pingStoriesSeo } from './seo-ping'
import { parseStories, STORIES_CONTENT_KEY } from './stories'
import { normalizePublicImageUrl } from './utils'
import type {
  Product,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginatedResponse,
  ThemeSettings,
  SocialLinks,
  SiteContent,
  ExchangeRate,
  AllSettings,
  BrandingSettings,
  User,
  Banner,
  UpdateMyProfileDto,
} from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8888/api'

class ApiClient {
  private client: AxiosInstance
  private baseUrl: string

  constructor(baseURL: string) {
    this.baseUrl = baseURL
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      timeout: 30000,
    })

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

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const originalRequest: any = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error)
          }

          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
              throw new Error('No refresh token')
            }

            const { data } = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: { Authorization: `Bearer ${refreshToken}` },
              },
            )

            localStorage.setItem('accessToken', data.data.accessToken)
            localStorage.setItem('refreshToken', data.data.refreshToken)

            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
            return this.client(originalRequest)
          } catch (refreshError: any) {
            if (typeof window !== 'undefined') {
              const isAdminPage = window.location.pathname.includes('/admin')
              const locale = localStorage.getItem('locale') || 'vi'

              const savedLocale = localStorage.getItem('locale')
              localStorage.clear()
              if (savedLocale) {
                localStorage.setItem('locale', savedLocale)
              }

              const loginPath = isAdminPage ? `/${locale}/admin/login` : `/${locale}/login`

              console.error('Session expired. Please login again.')

              window.location.href = loginPath
            }

            return Promise.reject(refreshError)
          }
        }

        if (error.response?.status === 404) {
        }

        return Promise.reject(error)
      },
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken')
    }
    return null
  }

  private async request<T>(
    url: string,
    options?: {
      method?: string
      body?: string
      headers?: Record<string, string>
    },
  ): Promise<T> {
    const method = options?.method || 'GET'
    const config: any = {
      method,
      url,
      headers: options?.headers || {},
    }

    if (options?.body) {
      config.data = JSON.parse(options.body)
    }

    const response = await this.client.request(config)

    return response.data?.data !== undefined ? response.data.data : response.data
  }

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
    return this.request<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
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

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const response = await this.request<{ accessToken: string; refreshToken: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    )

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
    return this.request<User>('/auth/profile')
  }

  async updateMyProfile(data: UpdateMyProfileDto): Promise<User> {
    return this.request<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getBanners(activeOnly = true): Promise<Banner[]> {
    return this.request<Banner[]>('/banners', {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      method: 'GET',
    }).then((data) => {
      if (activeOnly) return data.filter((b: Banner) => b.isActive)
      return data
    })
  }

  async getBannerById(id: string): Promise<Banner> {
    return this.request<Banner>(`/banners/${id}`)
  }

  async createBanner(data: any): Promise<Banner> {
    const banner = await this.request<Banner>('/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return banner
  }

  async updateBanner(id: string, data: any): Promise<Banner> {
    const banner = await this.request<Banner>(`/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return banner
  }

  async deleteBanner(id: string): Promise<void> {
    const result = await this.request<void>(`/banners/${id}`, {
      method: 'DELETE',
    })
    void pingSitewideSeo()
    return result
  }

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
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params?.includeDeleted !== undefined)
      searchParams.set('includeDeleted', params.includeDeleted.toString())

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(
      `/products/admin/list${query ? `?${query}` : ''}`,
    )
  }

  async getAdminProductStats(): Promise<{
    totalProducts: number
    activeProducts: number
    featuredProducts: number
  }> {
    return this.request<{
      totalProducts: number
      activeProducts: number
      featuredProducts: number
    }>('/products/admin/stats')
  }

  async getProductById(id: string): Promise<Product> {
    return this.request<Product>(`/products/admin/id/${id}`)
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = await this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (product?.slug) {
      void pingProductSeo(product.slug)
    } else {
      void pingSitewideSeo()
    }
    return product
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (product?.slug) {
      void pingProductSeo(product.slug)
    } else {
      void pingSitewideSeo()
    }
    return product
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    })
    void pingSitewideSeo()
    return result
  }

  async restoreProduct(id: string): Promise<Product> {
    const product = await this.request<Product>(`/products/${id}/restore`, {
      method: 'POST',
    })
    if (product?.slug) {
      void pingProductSeo(product.slug)
    } else {
      void pingSitewideSeo()
    }
    return product
  }

  async duplicateProduct(id: string): Promise<Product> {
    const product = await this.request<Product>(`/products/${id}/duplicate`, {
      method: 'POST',
    })
    if (product?.slug) {
      void pingProductSeo(product.slug)
    } else {
      void pingSitewideSeo()
    }
    return product
  }

  async hardDeleteProduct(id: string): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>(`/products/${id}/permanent`, {
      method: 'DELETE',
    })
    void pingSitewideSeo()
    return result
  }

  async updateTheme(data: Partial<ThemeSettings>): Promise<ThemeSettings> {
    const theme = await this.request<ThemeSettings>('/settings/theme', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return theme
  }

  async updateSocialLinks(data: Partial<SocialLinks>): Promise<SocialLinks> {
    const socialLinks = await this.request<SocialLinks>('/settings/social-links', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return socialLinks
  }

  async updateSiteContent(data: SiteContent): Promise<{ success: boolean }> {
    const result = await this.request<{ success: boolean }>('/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (typeof data[STORIES_CONTENT_KEY] === 'string') {
      void pingStoriesSeo(parseStories(data[STORIES_CONTENT_KEY]))
    } else {
      void pingSitewideSeo()
    }
    return result
  }

  async updateExchangeRate(rate: number): Promise<ExchangeRate> {
    const exchangeRate = await this.request<ExchangeRate>('/settings/exchange-rate', {
      method: 'PUT',
      body: JSON.stringify({ rate }),
    })
    void pingSitewideSeo()
    return exchangeRate
  }

  async recalculateUsdPrices(): Promise<ExchangeRate> {
    return this.request<ExchangeRate>('/settings/exchange-rate/recalculate', {
      method: 'PUT',
    })
  }

  async getBranding(): Promise<BrandingSettings> {
    return this.request<BrandingSettings>('/settings/branding')
  }

  async updateBranding(data: Partial<BrandingSettings>): Promise<BrandingSettings> {
    const branding = await this.request<BrandingSettings>('/settings/branding', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return branding
  }

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
    return this.request<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`)
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

  async updateUser(id: string, data: Partial<User & { password?: string }>): Promise<User> {
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

  async uploadImage(
    file: File,
    folder: string = 'products',
  ): Promise<{ url: string; publicId?: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const token = this.getToken()
    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}/upload/product-image`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    const upload = result.data || result
    return {
      ...upload,
      url: upload.url ? normalizePublicImageUrl(upload.url) : upload.url,
    }
  }

  async getCategories(params?: {
    includeDeleted?: boolean
    includeInactive?: boolean
  }): Promise<Category[]> {
    const searchParams = new URLSearchParams()
    if (params?.includeDeleted !== undefined)
      searchParams.set('includeDeleted', params.includeDeleted.toString())
    if (params?.includeInactive !== undefined)
      searchParams.set('includeInactive', params.includeInactive.toString())

    const query = searchParams.toString()
    return this.request<Category[]>(`/categories${query ? `?${query}` : ''}`)
  }

  async getCategoryById(id: string): Promise<Category> {
    return this.request<Category>(`/categories/${id}`)
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    return this.request<Category>(`/categories/slug/${slug}`)
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const category = await this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return category
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.request<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    void pingSitewideSeo()
    return category
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    })
    void pingSitewideSeo()
    return result
  }

  async restoreCategory(id: string): Promise<Category> {
    const category = await this.request<Category>(`/categories/${id}/restore`, {
      method: 'POST',
    })
    void pingSitewideSeo()
    return category
  }

  async permanentDeleteCategory(id: string): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>(`/categories/${id}/permanent`, {
      method: 'DELETE',
    })
    void pingSitewideSeo()
    return result
  }
}

export const api = new ApiClient(API_BASE_URL)
