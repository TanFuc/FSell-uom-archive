import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEFAULT_EXCHANGE_RATE } from './constants'
import { type Locale } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  priceVND: number,
  locale: Locale,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): string {
  if (locale === 'vi') {
    return `${priceVND.toLocaleString('vi-VN')}₫`
  } else {
    const priceUSD = priceVND / exchangeRate
    return `$${priceUSD.toFixed(2)}`
  }
}

export function formatPriceVND(price: number): string {
  return `${price.toLocaleString('vi-VN')}₫`
}

export function formatPriceUSD(
  priceVND: number,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): string {
  const priceUSD = priceVND / exchangeRate
  return `$${priceUSD.toFixed(2)}`
}

export function getLocalizedValue<T extends Record<string, string>>(
  obj: T,
  key: string,
  locale: Locale,
): string {
  const localizedKey = `${key}.${locale}`
  return obj[localizedKey] || obj[`${key}.vi`] || ''
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.substring(0, length)}...`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getImageUrl(path: string): string {
  if (path.startsWith('http')) {
    try {
      const url = new URL(path)
      const r2PublicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '')
      if (r2PublicUrl && url.hostname.endsWith('.r2.dev')) {
        const normalizedPath = url.pathname.replace(/^\/uom-archive\//, '/').replace(/^\//, '')
        return `${r2PublicUrl}/${normalizedPath}`
      }
    } catch {
      return path
    }
    return path
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  return `${baseUrl}${path}`
}

/**
 * Optimizes and normalizes product images using Cloudinary transformations
 * Ensures all images have consistent aspect ratio (4:5) and quality
 *
 * @param imageUrl - The original image URL (can be Cloudinary or local)
 * @param options - Transformation options
 * @returns Optimized image URL with transformations
 */
export interface OptimizeImageOptions {
  width?: number
  height?: number
  quality?: 'auto' | number
  aspectRatio?: string
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad'
  gravity?: 'auto' | 'center' | 'face' | 'faces'
  format?: 'auto' | 'webp' | 'jpg' | 'png'
}

export function optimizeProductImage(imageUrl: string, options: OptimizeImageOptions = {}): string {
  const {
    width = 800,
    height = 1000,
    quality = 'auto',
    aspectRatio = '4:5',
    crop = 'fill',
    gravity = 'auto',
    format = 'auto',
  } = options

  if (!imageUrl.includes('cloudinary.com')) {
    return getImageUrl(imageUrl)
  }

  const uploadIndex = imageUrl.indexOf('/upload/')
  if (uploadIndex === -1) return imageUrl

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `g_${gravity}`,
    `ar_${aspectRatio}`,
    `q_${quality}`,
    `f_${format}`,
  ].join(',')

  const beforeUpload = imageUrl.substring(0, uploadIndex + 8)
  const afterUpload = imageUrl.substring(uploadIndex + 8)

  return `${beforeUpload}${transformations}/${afterUpload}`
}

/**
 * Get responsive image URLs for different screen sizes
 * Useful for Next.js Image component with srcSet
 */
export function getResponsiveProductImages(imageUrl: string) {
  return {
    small: optimizeProductImage(imageUrl, { width: 400, height: 500 }),
    medium: optimizeProductImage(imageUrl, { width: 800, height: 1000 }),
    large: optimizeProductImage(imageUrl, { width: 1200, height: 1500 }),
  }
}

export function formatDate(dateString: string, locale: Locale = 'vi'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
