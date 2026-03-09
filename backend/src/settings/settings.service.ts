import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import {
  UpdateThemeDto,
  UpdateSiteContentDto,
  UpdateSocialLinksDto,
  UpdateBrandingDto,
} from './dto'

const CACHE_TTL = 3600 // 1 hour in seconds

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ==================== THEME ====================

  async getTheme() {
    // Try cache first
    const cached = await this.redis.get('theme_settings')
    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from DB
    let theme = await this.prisma.themeSettings.findUnique({
      where: { id: 'singleton' },
    })

    // Create default if not exists
    if (!theme) {
      theme = await this.prisma.themeSettings.create({
        data: {
          id: 'singleton',
          backgroundColor: '#F9F7F1',
          textColor: '#4A4238',
          accentColor: '#8C7E6A',
        },
      })
    }

    // Cache for 1 hour
    await this.redis.set('theme_settings', JSON.stringify(theme), CACHE_TTL)

    return theme
  }

  async updateTheme(dto: UpdateThemeDto, userId?: string) {
    const theme = await this.prisma.themeSettings.upsert({
      where: { id: 'singleton' },
      update: { ...dto, updatedBy: userId },
      create: { id: 'singleton', ...dto, updatedBy: userId },
    })

    // Invalidate cache
    await this.redis.del('theme_settings')

    this.logger.log('Theme settings updated')
    return theme
  }

  // ==================== SITE CONTENT ====================

  async getSiteContent() {
    const cached = await this.redis.get('site_content')
    if (cached) {
      return JSON.parse(cached)
    }

    const content = await this.prisma.siteContent.findMany()

    // Convert to key-value object
    const contentMap = content.reduce(
      (acc, item) => {
        acc[item.key] = item.value
        return acc
      },
      {} as Record<string, string>,
    )

    // Set defaults if empty
    if (Object.keys(contentMap).length === 0) {
      const defaults: Record<string, string> = {
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
      }

      await this.prisma.siteContent.createMany({
        data: Object.entries(defaults).map(([key, value]) => ({ key, value })),
      })

      await this.redis.set('site_content', JSON.stringify(defaults), CACHE_TTL)
      return defaults
    }

    await this.redis.set('site_content', JSON.stringify(contentMap), CACHE_TTL)
    return contentMap
  }

  async updateSiteContent(dto: UpdateSiteContentDto, userId?: string) {
    const updates = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        return this.prisma.siteContent.upsert({
          where: { key },
          update: { value: value as string, updatedBy: userId },
          create: { key, value: value as string, updatedBy: userId },
        })
      })

    await this.prisma.$transaction(updates)
    await this.redis.del('site_content')

    this.logger.log('Site content updated')
    return { success: true }
  }

  // ==================== SOCIAL LINKS (Using SocialSettings model) ====================

  async getSocialLinks() {
    const cached = await this.redis.get('social_links')
    if (cached) {
      return JSON.parse(cached)
    }

    const settings = await this.prisma.socialSettings.findUnique({
      where: { id: 'singleton' },
    })

    const socialLinks = {
      facebookPageUrl: settings?.facebookPageUrl || 'https://m.me/uomarchive',
      instagramUsername: settings?.instagramUsername || 'uomarchive',
    }

    await this.redis.set('social_links', JSON.stringify(socialLinks), CACHE_TTL)
    return socialLinks
  }

  async updateSocialLinks(dto: UpdateSocialLinksDto, userId?: string) {
    const settings = await this.prisma.socialSettings.upsert({
      where: { id: 'singleton' },
      update: { ...dto, updatedBy: userId },
      create: {
        id: 'singleton',
        facebookPageUrl: dto.facebookPageUrl || '',
        instagramUsername: dto.instagramUsername || '',
        updatedBy: userId,
      },
    })

    // Clear cache
    await this.redis.del('social_links')

    this.logger.log('Social links updated')
    return {
      facebookPageUrl: settings.facebookPageUrl,
      instagramUsername: settings.instagramUsername,
    }
  }

  // ==================== INQUIRY LINK GENERATION ====================

  async generateFacebookInquiryLink(message: string): Promise<string> {
    const socialLinks = await this.getSocialLinks()
    const baseUrl = socialLinks.facebookPageUrl || 'https://m.me/uomarchive'

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)

    return `${baseUrl}?text=${encodedMessage}`
  }

  async generateInstagramInquiryLink(message: string): Promise<string> {
    const socialLinks = await this.getSocialLinks()
    const username = socialLinks.instagramUsername || 'uomarchive'

    // Instagram deep link format
    const encodedMessage = encodeURIComponent(message)

    return `https://ig.me/m/${username}?text=${encodedMessage}`
  }

  // ==================== EXCHANGE RATE ====================

  async getExchangeRate(): Promise<{ rate: number }> {
    const cached = await this.redis.get('exchange_rate')
    if (cached) {
      return { rate: parseFloat(cached) }
    }

    const setting = await this.prisma.siteSettings.findUnique({
      where: { key: 'exchange_rate' },
    })

    const rate = setting ? parseFloat(setting.value) : 25000 // Default

    await this.redis.set('exchange_rate', rate.toString(), CACHE_TTL)
    return { rate }
  }

  async updateExchangeRate(rate: number) {
    await this.prisma.siteSettings.upsert({
      where: { key: 'exchange_rate' },
      update: { value: rate.toString() },
      create: { key: 'exchange_rate', value: rate.toString() },
    })

    await this.redis.del('exchange_rate')

    this.logger.log(`Exchange rate updated to ${rate}`)
    return { rate }
  }

  // ==================== ALL PUBLIC SETTINGS ====================

  async getAllPublicSettings() {
    const [theme, siteContent, socialLinks, exchangeRate] = await Promise.all([
      this.getTheme(),
      this.getSiteContent(),
      this.getSocialLinks(),
      this.getExchangeRate(),
    ])

    return {
      theme,
      siteContent,
      socialLinks,
      exchangeRate: exchangeRate.rate,
    }
  }

  // ==================== BRANDING ====================

  async getBranding() {
    const cached = await this.redis.get('branding_settings')
    if (cached) {
      return JSON.parse(cached)
    }

    const content = await this.prisma.siteContent.findMany({
      where: {
        key: {
          in: [
            'brand.name.vi',
            'brand.name.en',
            'site.title.vi',
            'site.title.en',
            'site.description.vi',
            'site.description.en',
            'site.logoUrl',
            'site.loadingText',
          ],
        },
      },
    })

    const map = content.reduce(
      (acc, item) => {
        acc[item.key] = item.value
        return acc
      },
      {} as Record<string, string>,
    )

    const branding = {
      brandNameVi: map['brand.name.vi'] || 'ƯƠM. Archive',
      brandNameEn: map['brand.name.en'] || 'ƯƠM. Archive',
      siteTitleVi: map['site.title.vi'] || 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam',
      siteTitleEn: map['site.title.en'] || 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam',
      siteDescriptionVi: map['site.description.vi'] || 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.',
      siteDescriptionEn: map['site.description.en'] || 'Discover timeless Vietnamese ceramics curated with care.',
      logoUrl: map['site.logoUrl'] || '',
      loadingText: map['site.loadingText'] || 'ƯƠM.',
    }

    await this.redis.set('branding_settings', JSON.stringify(branding), CACHE_TTL)
    return branding
  }

  async updateBranding(dto: UpdateBrandingDto, userId?: string) {
    const keyMap: Record<string, keyof UpdateBrandingDto> = {
      'brand.name.vi': 'brandNameVi',
      'brand.name.en': 'brandNameEn',
      'site.title.vi': 'siteTitleVi',
      'site.title.en': 'siteTitleEn',
      'site.description.vi': 'siteDescriptionVi',
      'site.description.en': 'siteDescriptionEn',
      'site.logoUrl': 'logoUrl',
      'site.loadingText': 'loadingText',
    }

    const updates = Object.entries(keyMap)
      .filter(([, dtoKey]) => dto[dtoKey] !== undefined)
      .map(([contentKey, dtoKey]) =>
        this.prisma.siteContent.upsert({
          where: { key: contentKey },
          update: { value: dto[dtoKey] as string, updatedBy: userId },
          create: { key: contentKey, value: dto[dtoKey] as string, updatedBy: userId },
        }),
      )

    await this.prisma.$transaction(updates)

    // Invalidate both branding and site_content caches
    await this.redis.del('branding_settings')
    await this.redis.del('site_content')

    this.logger.log('Branding settings updated')
    return this.getBranding()
  }
}
