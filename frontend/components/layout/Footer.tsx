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
      : branding?.brandNameEn || cachedBranding?.brandNameEn || 'Uom Archive'

  const brandTagline =
    locale === 'vi'
      ? branding?.brandTaglineVi || cachedBranding?.brandTaglineVi || t('description')
      : branding?.brandTaglineEn || cachedBranding?.brandTaglineEn || t('description')

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white px-6 py-12 text-foreground lg:px-12">
      <div className="flex w-full flex-col gap-10">
        {/* Main Footer: Compact Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="inline-block font-playfair text-2xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-70"
            >
              {brandName}
            </Link>
            <p className="hidden text-[9px] font-medium uppercase leading-relaxed tracking-[0.2em] text-foreground/40 md:block">
              {brandTagline}
            </p>
          </div>

          {/* Navigation - Compact */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
              {t('navigation')}
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                href={`/${locale}/shop`}
                className="text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:opacity-60"
              >
                {t('shop')}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:opacity-60"
              >
                ABOUT US
              </Link>
              <Link
                href={`/${locale}/journal`}
                className="text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:opacity-60"
              >
                JOURNAL
              </Link>
            </nav>
          </div>

          {/* Connect - Compact */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
              {t('connect')}
            </h4>
            <div className="flex flex-col gap-2">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:opacity-60"
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
                  className="text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:opacity-60"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>

          {/* Legal - Compact */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
              LEGAL
            </h4>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/30">
                Terms
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/30">
                Privacy
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Merged into the flow, no border */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/30">
            © {currentYear} <span className="font-playfair text-xs lowercase">ƯƠM.</span>
          </p>
          <div className="flex gap-6 opacity-20">
            <span className="text-[8px] font-bold tracking-[0.5em]">VI</span>
            <span className="text-[8px] font-bold tracking-[0.5em]">EN</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
