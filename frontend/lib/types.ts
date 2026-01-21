// ==================== ENTITIES ====================

export interface Product {
  id: string
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi: string
  descriptionEn: string
  priceVND: number
  priceUSD?: number
  images: string[]
  material: string
  dimensions: string
  stock: number
  isActive: boolean
  inquiryEnabled: boolean
  inquiryMessageVi: string
  inquiryMessageEn: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: 'ADMIN' | 'MANAGER'
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ThemeSettings {
  id: string
  backgroundColor: string
  textColor: string
  accentColor: string
  updatedAt: string
}

export interface SocialLinks {
  id: string
  facebookPageUrl: string
  instagramUsername: string
  updatedAt: string
}

export interface SiteContent {
  [key: string]: string
}

export interface ExchangeRate {
  rate: number
  updatedAt: string
}

export interface AllSettings {
  theme: ThemeSettings
  siteContent: SiteContent
  socialLinks: SocialLinks
  exchangeRate: ExchangeRate
}

// ==================== DTOs ====================

// Auth DTOs
export interface RegisterDto {
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

// Product DTOs
export interface CreateProductDto {
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi: string
  descriptionEn: string
  priceVND: number
  images: string[]
  material: string
  dimensions: string
  stock: number
  isActive?: boolean
  inquiryEnabled?: boolean
  inquiryMessageVi?: string
  inquiryMessageEn?: string
}

export interface UpdateProductDto {
  slug?: string
  nameVi?: string
  nameEn?: string
  descriptionVi?: string
  descriptionEn?: string
  priceVND?: number
  images?: string[]
  material?: string
  dimensions?: string
  stock?: number
  isActive?: boolean
  inquiryEnabled?: boolean
  inquiryMessageVi?: string
  inquiryMessageEn?: string
}

export interface QueryProductsDto {
  page?: number
  limit?: number
  search?: string
  inquiryEnabled?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'nameVi' | 'nameEn' | 'priceVND'
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
  includeDeleted?: boolean
  createdBy?: string
}

export interface BulkDeleteDto {
  ids: string[]
}

export interface BulkUpdateDto {
  ids: string[]
  isActive?: boolean
  inquiryEnabled?: boolean
}

// User DTOs
export interface CreateUserDto {
  email: string
  password: string
  fullName: string
  role: 'ADMIN' | 'MANAGER'
  isActive?: boolean
}

export interface UpdateUserDto {
  fullName?: string
  role?: 'ADMIN' | 'MANAGER'
  isActive?: boolean
  password?: string
}

export interface QueryUsersDto {
  page?: number
  limit?: number
  search?: string
  role?: 'ADMIN' | 'MANAGER'
  isActive?: boolean
  includeDeleted?: boolean
}

// ==================== RESPONSES ====================

export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
  }
}
  facebookPageUrl: string
  instagramUsername: string
}

export interface SiteContent {
  [key: string]: string
}

export interface ExchangeRate {
  rate: number
}

export interface AllSettings {
  theme: ThemeSettings
  siteContent: SiteContent
  socialLinks: SocialLinks
  exchangeRate: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore?: boolean
  }
}

export interface ApiError {
  message: string
  statusCode: number
}

export type Locale = 'vi' | 'en'
