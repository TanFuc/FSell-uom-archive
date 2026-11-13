import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import {
  UpdateThemeDto,
  UpdateSiteContentDto,
  UpdateSocialLinksDto,
  UpdateBrandingDto,
  UpdatePaymentSettingsDto,
} from './dto'

const CACHE_TTL = 3600 // 1 hour in seconds
const DEFAULT_LOADING_TEXT = 'ƯƠM.'

function normalizeLoadingText(value?: string): string {
  const normalized = value?.trim()
  if (!normalized) return DEFAULT_LOADING_TEXT
  if (normalized.length > 24 || normalized.split(/\s+/).length > 3) return DEFAULT_LOADING_TEXT
  return normalized
}

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
    for (const key of ['site.pages', 'site.sections'] as const) {
      if (dto[key] !== undefined) {
        try {
          const parsed: unknown = JSON.parse(dto[key] as string)
          if (!Array.isArray(parsed) || parsed.length > 40) throw new Error('invalid array')
          const entries = parsed as unknown[]
          const isRecord = (entry: unknown): entry is Record<string, unknown> =>
            entry !== null && typeof entry === 'object' && !Array.isArray(entry)
          if (key === 'site.pages' && entries.some((entry) =>
            !isRecord(entry) || typeof entry.slug !== 'string' ||
            !/^[a-z0-9-]{1,60}$/.test(entry.slug) ||
            typeof entry.isVisible !== 'boolean' || typeof entry.titleVi !== 'string' ||
            typeof entry.titleEn !== 'string' || typeof entry.descriptionVi !== 'string' ||
            typeof entry.descriptionEn !== 'string' || typeof entry.contentVi !== 'string' ||
            typeof entry.contentEn !== 'string' || entry.contentVi.length > 20000 ||
            entry.contentEn.length > 20000,
          )) throw new Error('invalid page')
          if (key === 'site.sections' && entries.some((entry) =>
            !isRecord(entry) || typeof entry.key !== 'string' ||
            !(/^custom-[a-z0-9-]{1,60}$/.test(entry.key) || ['hero', 'products', 'journal', 'explore'].includes(entry.key)) ||
            typeof entry.isVisible !== 'boolean' || typeof entry.titleVi !== 'string' ||
            typeof entry.titleEn !== 'string' || typeof entry.subtitleVi !== 'string' ||
            typeof entry.subtitleEn !== 'string' ||
            (entry.bodyVi !== undefined && typeof entry.bodyVi !== 'string') ||
            (entry.bodyEn !== undefined && typeof entry.bodyEn !== 'string'),
          )) throw new Error('invalid section')
        } catch {
          throw new BadRequestException(`Cấu hình ${key} không hợp lệ`)
        }
      }
    }
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
      loadingText: normalizeLoadingText(map['site.loadingText']),
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

  async getPaymentSettings() {
    const cached = await this.redis.get('payment_settings')
    if (cached) {
      const parsed = this.parseCachedJson<any>(cached)
      if (parsed) return parsed
    }

    let settings = await this.prisma.paymentSettings.findUnique({
      where: { id: 'singleton' },
    })

    if (!settings) {
      settings = await this.prisma.paymentSettings.create({
        data: {
          id: 'singleton',
          qrCodeUrl: null,
          bankName: 'MB Bank',
          accountNumber: '',
          accountHolder: '',
          transferInstruction:
            'Vui lòng ghi rõ nội dung chuyển khoản là [Mã đơn hàng] để hệ thống xử lý nhanh chóng.',
        },
      })
    }

    await this.redis.set('payment_settings', JSON.stringify(settings), CACHE_TTL)
    return settings
  }

  async updatePaymentSettings(dto: UpdatePaymentSettingsDto, userId?: string) {
    const templates = dto.transferTemplates?.map((template) => ({
      id: String(template.id || '').trim().slice(0, 80),
      name: String(template.name || '').trim().slice(0, 100),
      content: String(template.content || '').trim().slice(0, 300),
    }))
    if (templates && (templates.length > 20 || templates.some((item) => !item.id || !item.name || !item.content))) {
      throw new BadRequestException('Danh sách mẫu nội dung chuyển khoản không hợp lệ')
    }
    if (dto.activeTemplateId && templates && !templates.some((item) => item.id === dto.activeTemplateId)) {
      throw new BadRequestException('Mẫu nội dung chuyển khoản đang chọn không tồn tại')
    }
    const settings = await this.prisma.paymentSettings.upsert({
      where: { id: 'singleton' },
      update: {
        ...(dto.qrCodeUrl !== undefined && { qrCodeUrl: dto.qrCodeUrl }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.accountHolder !== undefined && { accountHolder: dto.accountHolder }),
        ...(dto.transferInstruction !== undefined && {
          transferInstruction: dto.transferInstruction,
        }),
        ...(templates !== undefined && { transferTemplates: templates }),
        ...(dto.activeTemplateId !== undefined && { activeTemplateId: dto.activeTemplateId || null }),
        ...(dto.note !== undefined && { note: dto.note }),
        updatedBy: userId,
      },
      create: {
        id: 'singleton',
        qrCodeUrl: dto.qrCodeUrl || null,
        bankName: dto.bankName || '',
        accountNumber: dto.accountNumber || '',
        accountHolder: dto.accountHolder || '',
        transferInstruction: dto.transferInstruction || '',
        transferTemplates: templates || [],
        activeTemplateId: dto.activeTemplateId || null,
        note: dto.note || '',
        updatedBy: userId,
      },
    })

    await this.redis.del('payment_settings')
    this.logger.log('Payment settings updated')
    return settings
  }
}
