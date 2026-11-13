import { DEFAULT_EXCHANGE_RATE } from './constants'
import { type Product, type Locale } from './types'

export function generateFacebookInquiryUrl(facebookPageUrl: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)

  const baseUrl = facebookPageUrl.startsWith('http')
    ? facebookPageUrl
    : `https://m.me/${facebookPageUrl}`
  return `${baseUrl}?text=${encodedMessage}`
}

export function generateInstagramInquiryUrl(instagramUsername: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)

  const username = instagramUsername.replace('@', '')
  return `https://ig.me/m/${username}?text=${encodedMessage}`
}

export function generateDefaultInquiryMessage(
  product: Pick<Product, 'nameVi' | 'nameEn' | 'priceVND' | 'material' | 'dimensions'>,
  language: Locale,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
): string {
  if (language === 'vi') {
    return `Xin chào! Tôi quan tâm đến sản phẩm "${product.nameVi}".

Thông tin sản phẩm:
- Giá: ${product.priceVND.toLocaleString('vi-VN')}₫
- Chất liệu: ${product.material}
- Kích thước: ${product.dimensions}

Bạn có thể cho tôi biết thêm chi tiết không?`
  } else {
    const priceUSD = Math.round(product.priceVND / exchangeRate)
    return `Hello! I'm interested in the "${product.nameEn}".

Product details:
- Price: ${product.priceVND.toLocaleString('vi-VN')}₫ (~$${priceUSD})
- Material: ${product.material}
- Dimensions: ${product.dimensions}

Could you provide more information?`
  }
}

export function getInquiryMessage(product: Product, locale: Locale, exchangeRate?: number): string {
  const message = locale === 'vi' ? product.inquiryMessageVi : product.inquiryMessageEn

  if (!message || message.trim() === '') {
    return generateDefaultInquiryMessage(product, locale, exchangeRate)
  }

  return message
}
