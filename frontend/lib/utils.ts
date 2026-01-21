import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Locale } from './types'
import { DEFAULT_EXCHANGE_RATE } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  priceVND: number,
  locale: Locale,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
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

export function formatPriceUSD(priceVND: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE): string {
  const priceUSD = priceVND / exchangeRate
  return `$${priceUSD.toFixed(2)}`
}

export function getLocalizedValue<T extends Record<string, string>>(
  obj: T,
  key: string,
  locale: Locale
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
  if (path.startsWith('http')) return path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  return `${baseUrl}${path}`
}

export function formatDate(dateString: string, locale: Locale = 'vi'): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
