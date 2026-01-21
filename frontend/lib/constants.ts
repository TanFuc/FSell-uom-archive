import { ThemeSettings, SocialLinks, SiteContent } from './types'

export const DEFAULT_THEME: ThemeSettings = {
  id: 'default',
  backgroundColor: '#F9F7F1',
  textColor: '#4A4238',
  accentColor: '#8C7E6A',
  updatedAt: new Date().toISOString(),
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  facebookPageUrl: 'https://m.me/uomarchive',
  instagramUsername: 'uomarchive',
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  'menu.shop.vi': 'SẢN PHẨM',
  'menu.shop.en': 'SHOP',
  'menu.inquiry.vi': 'HỎI SẢN PHẨM',
  'menu.inquiry.en': 'INQUIRE',
  'menu.shipping.vi': 'VẬN CHUYỂN & ĐỔI TRẢ',
  'menu.shipping.en': 'SHIPPING & RETURNS',
  'brand.name.vi': 'Ươm Archive',
  'brand.name.en': 'Ươm Archive',
  'footer.text.vi': '© 2026 Ươm Archive. Tất cả quyền được bảo lưu.',
  'footer.text.en': '© 2026 Ươm Archive. All rights reserved.',
  'hero.title.vi': 'Vẻ đẹp trong sự tĩnh lặng',
  'hero.title.en': 'Beauty in Stillness',
  'hero.subtitle.vi': 'Gốm sứ thủ công từ Việt Nam',
  'hero.subtitle.en': 'Handcrafted ceramics from Vietnam',
}

export const DEFAULT_EXCHANGE_RATE = 25000

export const LOCALES = ['vi', 'en'] as const
export const DEFAULT_LOCALE = 'vi'
