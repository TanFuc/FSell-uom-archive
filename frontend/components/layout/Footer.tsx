'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useBranding, useSocialLinks } from '@/hooks/use-settings'

export function Footer() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('Footer')
  const { data: branding } = useBranding()
  const { data: socialLinks } = useSocialLinks()
  const BRANDING_CACHE_KEY = 'uom_branding_cache'

  const getCachedBranding = () => {
    if (typeof window === 'undefined') return undefined
    try {
      const stored = localStorage.getItem(BRANDING_CACHE_KEY)
      return stored
        ? (JSON.parse(stored) as {
            brandNameVi?: string
            brandNameEn?: string
            brandTaglineVi?: string
            brandTaglineEn?: string
          })
        : undefined
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

  const currentYear = new Date().getFullYear()
  const navigationItems = [
    { label: locale === 'vi' ? 'Trang chủ' : 'Home', href: `/${locale}` },
    { label: t('shop'), href: `/${locale}/shop` },
    { label: t('about'), href: `/${locale}/about` },
    { label: t('journal'), href: `/${locale}/journal` },
    { label: locale === 'vi' ? 'Liên hệ' : 'Contact', href: `/${locale}/about#contact` },
  ]

  return (
    <footer className="safe-screen border-t border-foreground/[0.04] bg-white px-4 py-8 text-foreground sm:px-6 sm:py-10 lg:px-12 lg:py-12">
      <div className="flex w-full flex-col gap-6 sm:gap-8 lg:gap-10">
        {/* Main Footer: Compact Grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-3 space-y-2 border-b border-foreground/[0.06] pb-5 sm:col-span-1 sm:border-b-0 sm:pb-0">
            <Link
              href={`/${locale}`}
              className="text-mobile-safe inline-block font-playfair text-xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-70 sm:text-2xl"
            >
              {brandName}
            </Link>
            <p className="max-w-[24rem] text-[9px] font-medium uppercase leading-relaxed tracking-[0.12em] text-foreground/40 sm:hidden md:block md:tracking-[0.2em]">
              {brandTagline}
            </p>
          </div>

          {/* Navigation - Compact */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-foreground sm:text-[10px] sm:tracking-[0.28em] lg:tracking-[0.4em]">
              {t('navigation')}
            </h4>
            <nav aria-label={locale === 'vi' ? 'Điều hướng chân trang' : 'Footer navigation'}>
              <ul className="flex flex-col gap-2">
                {navigationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className="block text-[9px] font-medium uppercase tracking-[0.1em] transition-all hover:opacity-60 sm:text-[10px] sm:tracking-[0.15em]"
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
            <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-foreground sm:text-[10px] sm:tracking-[0.28em] lg:tracking-[0.4em]">
              {t('connect')}
            </h4>
            <div className="flex flex-col gap-2">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-medium uppercase tracking-[0.1em] transition-all hover:opacity-60 sm:text-[10px] sm:tracking-[0.15em]"
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
                  className="text-[9px] font-medium uppercase tracking-[0.1em] transition-all hover:opacity-60 sm:text-[10px] sm:tracking-[0.15em]"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>

          {/* Legal - Compact */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-foreground sm:text-[10px] sm:tracking-[0.28em] lg:tracking-[0.4em]">
              LEGAL
            </h4>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/30 sm:text-[10px] sm:tracking-[0.15em]">
                Terms
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-foreground/30 sm:text-[10px] sm:tracking-[0.15em]">
                Privacy
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Merged into the flow, no border */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/[0.04] pt-4">
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-foreground/30 sm:tracking-[0.3em] lg:tracking-[0.4em]">
            © {currentYear} <span className="font-playfair text-xs lowercase">ƯƠM.</span>
          </p>
          <div className="flex gap-4 opacity-20 sm:gap-6">
            <span className="text-[8px] font-bold tracking-[0.3em] sm:tracking-[0.5em]">VI</span>
            <span className="text-[8px] font-bold tracking-[0.3em] sm:tracking-[0.5em]">EN</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
