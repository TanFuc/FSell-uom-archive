import { type ThemeSettings, type SocialLinks, type SiteContent } from './types'

export const DEFAULT_THEME: ThemeSettings = {
  id: 'default',
  backgroundColor: '#F9F7F1',
  textColor: '#4A4238',
  accentColor: '#8C7E6A',
  updatedAt: new Date().toISOString(),
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  id: 'default',
  facebookPageUrl: 'https://m.me/uomarchive',
  instagramUsername: 'uomarchive',
  updatedAt: new Date().toISOString(),
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  'menu.shop.vi': 'SẢN PHẨM',
  'menu.shop.en': 'SHOP',
  'menu.inquiry.vi': 'HỎI SẢN PHẨM',
  'menu.inquiry.en': 'INQUIRE',
  'menu.shipping.vi': 'VẬN CHUYỂN & ĐỔI TRẢ',
  'menu.shipping.en': 'SHIPPING & RETURNS',
  'brand.name.vi': 'ƯƠM. Archive',
  'brand.name.en': 'ƯƠM. Archive',
  'footer.text.vi': '© 2026 ƯƠM. Archive. Tất cả quyền được bảo lưu.',
  'footer.text.en': '© 2026 ƯƠM. Archive. All rights reserved.',
  'hero.title.vi': 'Vẻ đẹp trong sự tĩnh lặng',
  'hero.title.en': 'Beauty in Stillness',
  'hero.subtitle.vi': 'Gốm sứ thủ công từ Việt Nam',
  'hero.subtitle.en': 'Handcrafted ceramics from Vietnam',
  'search.trending.vi': JSON.stringify([
    'binh gom',
    'chen tra',
    'men ran',
    'bo suu tap moi',
    'lo hoa toi gian',
  ]),
  'search.trending.en': JSON.stringify([
    'ceramic vase',
    'tea cup',
    'crackle glaze',
    'new collection',
    'minimal decor',
  ]),
}

export const DEFAULT_EXCHANGE_RATE = 25000

export const LOCALES = ['vi', 'en'] as const
export const DEFAULT_LOCALE = 'vi'
