import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import {
  UpdateThemeDto,
  UpdateSiteContentDto,
  UpdateSocialLinksDto,
  UpdateBrandingDto,
} from './dto'

const CACHE_TTL = 3600 // 1 hour in seconds

type SocialLinks = {
  facebookPageUrl: string
  instagramUsername: string
}

type BrandingSettings = {
  brandNameVi: string
  brandNameEn: string
  brandTaglineVi: string
  brandTaglineEn: string
  siteTitleVi: string
  siteTitleEn: string
  siteDescriptionVi: string
  siteDescriptionEn: string
  logoUrl: string
  loadingText: string
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name)

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private parseCachedJson<T>(cached: string): T | null {
    try {
      return JSON.parse(cached) as T
    } catch {
      return null
    }
  }

  async getTheme() {
    const cached = await this.redis.get('theme_settings')
    if (cached) {
      const parsed = this.parseCachedJson<unknown>(cached)
      if (parsed) return parsed
    }

    let theme = await this.prisma.themeSettings.findUnique({
      where: { id: 'singleton' },
    })

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

    await this.redis.set('theme_settings', JSON.stringify(theme), CACHE_TTL)

    return theme
  }

  async updateTheme(dto: UpdateThemeDto, userId?: string) {
    const theme = await this.prisma.themeSettings.upsert({
      where: { id: 'singleton' },
      update: { ...dto, updatedBy: userId },
      create: { id: 'singleton', ...dto, updatedBy: userId },
    })

    await this.redis.del('theme_settings')

    this.logger.log('Theme settings updated')
    return theme
  }

  async getSiteContent() {
    const cached = await this.redis.get('site_content')
    if (cached) {
      const parsed = this.parseCachedJson<Record<string, string>>(cached)
      if (parsed) return parsed
    }

    const content = await this.prisma.siteContent.findMany()

    const contentMap = content.reduce(
      (acc, item) => {
        acc[item.key] = item.value
        return acc
      },
      {} as Record<string, string>,
    )

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

  async getSocialLinks(): Promise<SocialLinks> {
    const cached = await this.redis.get('social_links')
    if (cached) {
      const parsed = this.parseCachedJson<SocialLinks>(cached)
      if (parsed) return parsed
    }

    const settings = await this.prisma.socialSettings.findUnique({
      where: { id: 'singleton' },
    })

    const socialLinks = {
      facebookPageUrl: settings?.facebookPageUrl ?? 'https://m.me/uomarchive',
      instagramUsername: settings?.instagramUsername ?? 'uomarchive',
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
        facebookPageUrl: dto.facebookPageUrl ?? '',
        instagramUsername: dto.instagramUsername ?? '',
        updatedBy: userId,
      },
    })

    await this.redis.del('social_links')

    this.logger.log('Social links updated')
    return {
      facebookPageUrl: settings.facebookPageUrl,
      instagramUsername: settings.instagramUsername,
    }
  }

  async generateFacebookInquiryLink(message: string): Promise<string> {
    const socialLinks = await this.getSocialLinks()
    const baseUrl = socialLinks.facebookPageUrl ?? 'https://m.me/uomarchive'

    const encodedMessage = encodeURIComponent(message)

    return `${baseUrl}?text=${encodedMessage}`
  }

  async generateInstagramInquiryLink(message: string): Promise<string> {
    const socialLinks = await this.getSocialLinks()
    const username = socialLinks.instagramUsername ?? 'uomarchive'

    const encodedMessage = encodeURIComponent(message)

    return `https://ig.me/m/${username}?text=${encodedMessage}`
  }

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

  async updateExchangeRate(rate: number, userId?: string) {
    const normalizedRate = Number(rate)
    const updatedProducts = await this.prisma.$transaction(async (tx) => {
      await tx.siteSettings.upsert({
        where: { key: 'exchange_rate' },
        update: { value: normalizedRate.toString() },
        create: { key: 'exchange_rate', value: normalizedRate.toString() },
      })

      return this.recalculateUsdPricesTx(tx, normalizedRate, userId)
    })

    await this.redis.del('exchange_rate')
    await this.invalidateProductPriceCaches()

    this.logger.log(
      `Exchange rate updated to ${normalizedRate}, recalculated ${updatedProducts} products`,
    )
    return { rate: normalizedRate, updatedProducts }
  }

  async recalculateUsdPrices(userId?: string) {
    const { rate } = await this.getExchangeRate()

    const updatedProducts = await this.prisma.$transaction((tx) =>
      this.recalculateUsdPricesTx(tx, rate, userId),
    )

    await this.invalidateProductPriceCaches()
    this.logger.log(`Recalculated USD prices for ${updatedProducts} products at rate ${rate}`)

    return { rate, updatedProducts }
  }

  private async recalculateUsdPricesTx(
    tx: Prisma.TransactionClient,
    rate: number,
    userId?: string,
  ) {
    const products = await tx.product.findMany({
      where: { hardDeletedAt: null },
      select: {
        id: true,
        priceVND: true,
        salePriceVND: true,
      },
    })

    if (products.length === 0) {
      return 0
    }

    const updates = products.map(
      (product: { id: string; priceVND: number; salePriceVND: number | null }) =>
        tx.product.update({
          where: { id: product.id },
          data: {
            priceUSD: Math.round((product.priceVND / rate) * 100) / 100,
            salePriceUSD:
              product.salePriceVND !== null
                ? Math.round((product.salePriceVND / rate) * 100) / 100
                : null,
            updatedBy: userId,
          },
        }),
    )

    await Promise.all(updates)
    return products.length
  }

  private async invalidateProductPriceCaches() {
    const productListKeys = await this.redis.keys('products:*')
    const productSlugKeys = await this.redis.keys('product:slug:*')
    const keysToDelete = [...productListKeys, ...productSlugKeys]

    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((key) => this.redis.del(key)))
    }
  }

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

  async getBranding(): Promise<BrandingSettings> {
    const cached = await this.redis.get('branding_settings')
    if (cached) {
      const parsed = this.parseCachedJson<BrandingSettings>(cached)
      if (parsed) return parsed
    }

    const content = await this.prisma.siteContent.findMany({
      where: {
        key: {
          in: [
            'brand.name.vi',
            'brand.name.en',
            'brand.tagline.vi',
            'brand.tagline.en',
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
      brandNameVi: map['brand.name.vi'] ?? 'ƯƠM. Archive',
      brandNameEn: map['brand.name.en'] ?? 'ƯƠM. Archive',
      brandTaglineVi: map['brand.tagline.vi'] ?? '',
      brandTaglineEn: map['brand.tagline.en'] ?? '',
      siteTitleVi: map['site.title.vi'] ?? 'ƯƠM. - Gốm sứ thủ công Việt Nam',
      siteTitleEn: map['site.title.en'] ?? 'ƯƠM. - Handcrafted Ceramics from Vietnam',
      siteDescriptionVi:
        map['site.description.vi'] ??
        'ƯƠM. tuyển chọn gốm sứ thủ công Việt Nam, lưu giữ vẻ đẹp mộc mạc, tinh tế và câu chuyện của nghệ nhân bản địa.',
      siteDescriptionEn:
        map['site.description.en'] ??
        'Discover Vietnamese handcrafted ceramics curated for quiet beauty, refined living, and artisan stories.',
      logoUrl: map['site.logoUrl'] ?? '',
      loadingText: map['site.loadingText'] ?? 'ƯƠM.',
    }

    await this.redis.set('branding_settings', JSON.stringify(branding), CACHE_TTL)
    return branding
  }

  async updateBranding(dto: UpdateBrandingDto, userId?: string) {
    const keyMap: Record<string, keyof UpdateBrandingDto> = {
      'brand.name.vi': 'brandNameVi',
      'brand.name.en': 'brandNameEn',
      'brand.tagline.vi': 'brandTaglineVi',
      'brand.tagline.en': 'brandTaglineEn',
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

    await this.redis.del('branding_settings')
    await this.redis.del('site_content')

    this.logger.log('Branding settings updated')
    return this.getBranding()
  }
}
