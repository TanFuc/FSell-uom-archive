import { DEFAULT_EXCHANGE_RATE } from './constants'
import { type Locale, type Product } from './types'

/**
 * Format currency based on locale
 */
export function formatCurrency(
  amount: number,
  currency: 'VND' | 'USD',
  locale: Locale = 'vi',
): string {
  if (currency === 'VND') {
    return `${amount.toLocaleString('vi-VN')}₫`
  } else {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

/**
 * Convert price between currencies
 */
export function convertPrice(
  amount: number,
  from: 'VND' | 'USD',
  to: 'VND' | 'USD',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): number {
  if (from === to) return amount

  if (from === 'VND' && to === 'USD') {
    return Math.round((amount / exchangeRate) * 100) / 100
  } else {
    return Math.round(amount * exchangeRate)
  }
}

/**
 * Get display price for a product based on locale
 * Returns the sale price if available, otherwise the regular price
 */
export function getDisplayPrice(
  product: Product,
  locale: Locale,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): {
  currentPrice: string
  originalPrice: string | null
  hasDiscount: boolean
  discountPercentage: number | null
} {
  const isEnglish = locale === 'en'

  // Get the appropriate prices based on locale
  let currentPriceValue: number
  let originalPriceValue: number

  if (isEnglish) {
    // For English, prefer USD prices
    originalPriceValue =
      product.priceUSD ?? convertPrice(product.priceVND, 'VND', 'USD', exchangeRate)
    currentPriceValue =
      product.salePriceUSD ??
      (product.salePriceVND
        ? convertPrice(product.salePriceVND, 'VND', 'USD', exchangeRate)
        : originalPriceValue)
  } else {
    // For Vietnamese, use VND prices
    originalPriceValue = product.priceVND
    currentPriceValue = product.salePriceVND ?? product.priceVND
  }

  const hasDiscount = product.salePriceVND != null && product.salePriceVND < product.priceVND
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.priceVND - (product.salePriceVND ?? product.priceVND)) / product.priceVND) * 100,
      )
    : null

  const currency = isEnglish ? 'USD' : 'VND'

  return {
    currentPrice: formatCurrency(currentPriceValue, currency, locale),
    originalPrice: hasDiscount ? formatCurrency(originalPriceValue, currency, locale) : null,
    hasDiscount,
    discountPercentage,
  }
}

/**
 * Format price for display in product cards
 * Shows both sale and original price when applicable
 */
export function formatProductPrice(
  product: Product,
  locale: Locale,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): string {
  const { currentPrice, originalPrice, hasDiscount } = getDisplayPrice(
    product,
    locale,
    exchangeRate,
  )

  if (hasDiscount && originalPrice) {
    return `${currentPrice} (${originalPrice})`
  }

  return currentPrice
}

/**
 * Calculate USD from VND
 */
export function vndToUsd(vnd: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE): number {
  return Math.round((vnd / exchangeRate) * 100) / 100
}

/**
 * Calculate VND from USD
 */
export function usdToVnd(usd: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE): number {
  return Math.round(usd * exchangeRate)
}
