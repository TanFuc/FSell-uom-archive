'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useBranding, useSiteContent, useSocialLinks } from '@/hooks/use-settings'
import { pageHref, parseSitePages } from '@/lib/site-structure'
import type { SiteContent } from '@/lib/types'

interface FooterProps {
  initialSiteContent?: SiteContent
}

export function Footer({ initialSiteContent }: FooterProps) {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('Footer')
  const { data: branding } = useBranding()
  const { data: socialLinks } = useSocialLinks()
  const { data: siteContent } = useSiteContent({
    initialData: initialSiteContent,
  })
  const BRANDING_CACHE_KEY = 'uom_branding_cache'

  const getCachedBranding = () => {
    if (typeof window === 'undefined') return undefined
    try {
      const stored = localStorage.getItem(BRANDING_CACHE_KEY)
      if (!stored) return undefined
      const parsed = JSON.parse(stored) as {
        brandNameVi?: string
        brandNameEn?: string
        brandTaglineVi?: string
        brandTaglineEn?: string
      }
      if (
        [parsed.brandNameVi, parsed.brandNameEn, parsed.brandTaglineVi, parsed.brandTaglineEn].some(
          (value) => typeof value === 'string' && (value.includes('UOM.') || value.includes('Æ')),
        )
      ) {
        localStorage.removeItem(BRANDING_CACHE_KEY)
        return undefined
      }
      return parsed
    } catch {
      return undefined
    }
  }

  const [cachedBranding, setCachedBranding] = useState<
    | {
        brandNameVi?: string
        brandNameEn?: string
        brandTaglineVi?: string
        brandTaglineEn?: string
      }
    | undefined
  >(undefined)

  useEffect(() => {
    setCachedBranding(getCachedBranding())
  }, [
    branding?.brandNameVi,
    branding?.brandNameEn,
    branding?.brandTaglineVi,
    branding?.brandTaglineEn,
  ])

  const brandName =
    locale === 'vi'
      ? branding?.brandNameVi || cachedBranding?.brandNameVi || 'ƯƠM. Archive'
      : branding?.brandNameEn || cachedBranding?.brandNameEn || 'ƯƠM.'

  const brandTagline =
    locale === 'vi'
      ? branding?.brandTaglineVi || cachedBranding?.brandTaglineVi || t('description')
      : branding?.brandTaglineEn || cachedBranding?.brandTaglineEn || t('description')

  const copyrightYear = 2026
  const sitePages = parseSitePages(siteContent)
  const navigationItems = sitePages
    .filter((page) => page.isVisible && (page.slug !== 'contact' || sitePages.find((item) => item.slug === 'about')?.isVisible))
    .map((page) => ({ label: locale === 'vi' ? page.titleVi : page.titleEn, href: pageHref(locale, page.slug) }))

  return (
    <footer className="safe-screen border-t border-foreground/[0.04] bg-white px-4 py-8 text-foreground sm:px-6 sm:py-10 lg:px-12 lg:py-12">
      <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-10">
        {/* Main Footer: Compact Grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-3 space-y-2 border-b border-foreground/[0.06] pb-5 sm:col-span-1 sm:border-b-0 sm:pb-0">
            <Link
              href={`/${locale}`}
              className="text-mobile-safe inline-block font-serif text-xl font-light tracking-tight text-[#4A4238] transition-opacity hover:opacity-70 sm:text-2xl"
              suppressHydrationWarning
            >
              {brandName}
            </Link>
            <p
              className="max-w-[24rem] font-serif italic text-xs leading-relaxed text-[#8C7E6A] sm:hidden md:block"
              suppressHydrationWarning
            >
              {brandTagline}
            </p>
          </div>

          {/* Navigation - Compact */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
              {t('navigation')}
            </h4>
            <nav aria-label={locale === 'vi' ? 'Điều hướng chân trang' : 'Footer navigation'}>
              <ul className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className="block font-sans text-xs font-medium text-stone-600 hover:text-[#4A4238] transition-colors"
                      suppressHydrationWarning
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Connect - Compact */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
              {t('connect')}
            </h4>
            <div className="flex flex-col gap-2">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-sans text-xs font-medium text-stone-600 hover:text-[#4A4238] transition-colors"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-sans text-xs font-medium text-stone-600 hover:text-[#4A4238] transition-colors"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>

          {/* Legal - Compact */}
          <div className="space-y-3">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#4A4238]">
              LEGAL
            </h4>
            <div className="flex flex-col gap-2">
              <span className="font-sans text-xs font-normal text-stone-400">
                Terms
              </span>
              <span className="font-sans text-xs font-normal text-stone-400">
                Privacy
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Merged into the flow, no border */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.04] pt-4">
          <p
            className="font-sans text-xs text-stone-400 font-normal tracking-wide"
            suppressHydrationWarning
          >
            © {copyrightYear} <span className="font-serif text-sm font-light text-[#4A4238]">ƯƠM.</span>
          </p>
          <div className="flex gap-4 opacity-40 sm:gap-6 font-sans text-xs font-medium">
            <span>VI</span>
            <span>EN</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
