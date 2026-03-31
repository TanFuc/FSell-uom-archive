import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { SettingsService } from './settings.service'
import {
  UpdateThemeDto,
  UpdateSiteContentDto,
  UpdateSocialLinksDto,
  UpdateExchangeRateDto,
  UpdateBrandingDto,
} from './dto'
import { JwtAuthGuard, RolesGuard } from '../auth/guards'
import { Roles, CurrentUser, JwtPayload } from '../auth/decorators'

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // ==================== ALL PUBLIC SETTINGS ====================

  @Get()
  @ApiOperation({ summary: 'Get all public settings (theme, content, social, exchange rate)' })
  @ApiResponse({ status: 200, description: 'All public settings' })
  async getAllSettings() {
    return this.settingsService.getAllPublicSettings()
  }

  // ==================== THEME ====================

  @Get('theme')
  @ApiOperation({ summary: 'Get current theme settings (public)' })
  @ApiResponse({ status: 200, description: 'Theme settings' })
  async getTheme() {
    return this.settingsService.getTheme()
  }

  @Put('theme')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update theme settings' })
  @ApiResponse({ status: 200, description: 'Theme updated' })
  async updateTheme(@Body() dto: UpdateThemeDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateTheme(dto, user.sub)
  }

  // ==================== SITE CONTENT ====================

  @Get('site-content')
  @ApiOperation({ summary: 'Get site content (menu, footer, etc.) (public)' })
  @ApiResponse({ status: 200, description: 'Site content' })
  async getSiteContent() {
    return this.settingsService.getSiteContent()
  }

  @Put('site-content')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update site content' })
  @ApiResponse({ status: 200, description: 'Site content updated' })
  async updateSiteContent(@Body() dto: UpdateSiteContentDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateSiteContent(dto, user.sub)
  }

  // ==================== SOCIAL LINKS ====================

  @Get('social-links')
  @ApiOperation({ summary: 'Get social media links for inquiry feature (public)' })
  @ApiResponse({ status: 200, description: 'Social links (Facebook, Instagram)' })
  async getSocialLinks() {
    return this.settingsService.getSocialLinks()
  }

  @Put('social-links')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update social media links (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Social links updated' })
  async updateSocialLinks(@Body() dto: UpdateSocialLinksDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateSocialLinks(dto, user.sub)
  }

  // ==================== EXCHANGE RATE ====================

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Get current VND/USD exchange rate (public)' })
  @ApiResponse({ status: 200, description: 'Exchange rate' })
  async getExchangeRate() {
    return this.settingsService.getExchangeRate()
  }

  @Put('exchange-rate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update exchange rate (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Exchange rate updated' })
  async updateExchangeRate(@Body() dto: UpdateExchangeRateDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateExchangeRate(dto.rate)
  }

  // ==================== BRANDING ====================

  @Get('branding')
  @ApiOperation({
    summary: 'Get branding settings: logo, brand name, site title, loading text (public)',
  })
  @ApiResponse({ status: 200, description: 'Branding settings' })
  async getBranding() {
    return this.settingsService.getBranding()
  }

  @Put('branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update branding settings (logo, brand name, site title, loading text)',
  })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  async updateBranding(@Body() dto: UpdateBrandingDto, @CurrentUser() user: JwtPayload) {
    return this.settingsService.updateBranding(dto, user.sub)
  }
}
