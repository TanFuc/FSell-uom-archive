// ==================== ENTITIES ====================

export interface Category {
  id: string
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi?: string | null
  descriptionEn?: string | null
  image?: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
  _count?: {
    products: number
  }
}

export interface Product {
  id: string
  slug: string
  nameVi: string
  nameEn: string
  shortDescriptionVi: string
  shortDescriptionEn: string
  descriptionVi: string
  descriptionEn: string
  categoryId?: string | null
  category?: Category | null
  priceVND: number
  priceUSD?: number | null
  salePriceVND?: number | null
  salePriceUSD?: number | null
  images: string[]
  hoverImage?: string | null
  material: string
  dimensions: string
  stock: number
  isActive: boolean
  isFeatured: boolean
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

export interface Banner {
  id: string
  titleVi?: string
  titleEn?: string
  subtitleVi?: string
  subtitleEn?: string
  descriptionVi?: string
  descriptionEn?: string
  imageUrl: string
  mobileImageUrl?: string
  link?: string
  order: number
  isActive: boolean
  textColor?: string
  textPosition?: 'center' | 'left' | 'right'
  createdAt: string
  updatedAt: string
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

export interface CreateProductDto {
  slug: string
  nameVi: string
  nameEn: string
  shortDescriptionVi?: string
  shortDescriptionEn?: string
  descriptionVi: string
  descriptionEn: string
  priceVND: number
  priceUSD?: number
  salePriceVND?: number
  salePriceUSD?: number
  images: string[]
  hoverImage?: string
  material: string
  dimensions: string
  stock: number
  isActive?: boolean
  isFeatured?: boolean
  inquiryEnabled?: boolean
  inquiryMessageVi?: string
  inquiryMessageEn?: string
  categoryId?: string | null
}

export interface UpdateProductDto {
  slug?: string
  nameVi?: string
  nameEn?: string
  shortDescriptionVi?: string
  shortDescriptionEn?: string
  descriptionVi?: string
  descriptionEn?: string
  priceVND?: number
  priceUSD?: number
  salePriceVND?: number | null
  salePriceUSD?: number | null
  images?: string[]
  hoverImage?: string | null
  material?: string
  dimensions?: string
  stock?: number
  isActive?: boolean
  isFeatured?: boolean
  inquiryEnabled?: boolean
  inquiryMessageVi?: string
  inquiryMessageEn?: string
  categoryId?: string | null
}

// Category DTOs
export interface CreateCategoryDto {
  slug: string
  nameVi: string
  nameEn: string
  descriptionVi?: string
  descriptionEn?: string
  image?: string
  order?: number
  isActive?: boolean
}

export interface UpdateCategoryDto {
  slug?: string
  nameVi?: string
  nameEn?: string
  descriptionVi?: string | null
  descriptionEn?: string | null
  image?: string | null
  order?: number
  isActive?: boolean
}

export interface QueryCategoriesDto {
  includeDeleted?: boolean
  includeInactive?: boolean
}

export interface QueryProductsDto {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  inquiryEnabled?: boolean
  isFeatured?: boolean
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
  isFeatured?: boolean
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

// ==================== RESPONSES ====================

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

// Override AllSettings to match backend response for public settings
export interface AllSettings {
  theme: ThemeSettings
  siteContent: SiteContent
  socialLinks: SocialLinks
  exchangeRate: number
}
