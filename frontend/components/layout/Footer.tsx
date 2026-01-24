'use client'

import { Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useSocialLinks } from '@/hooks/use-settings'

export function Footer() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('Footer')
  const { data: socialLinks } = useSocialLinks()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white py-12 px-6 lg:px-12 text-foreground">
      <div className="w-full flex flex-col gap-10">
        {/* Main Footer: Compact Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="inline-block font-playfair text-2xl font-bold tracking-tighter text-foreground transition-opacity hover:opacity-70"
            >
              Ươm.
            </Link>
            <p className="text-[9px] leading-relaxed uppercase tracking-[0.2em] font-medium text-foreground/40 hidden md:block">
              {t('description')}
            </p>
          </div>

          {/* Navigation - Compact */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">
              {t('navigation')}
            </h4>
            <nav className="flex flex-col gap-2">
              <Link href={`/${locale}/shop`} className="text-[10px] uppercase tracking-[0.15em] font-medium transition-all hover:opacity-60">
                {t('shop')}
              </Link>
              <Link href={`/${locale}/about`} className="text-[10px] uppercase tracking-[0.15em] font-medium transition-all hover:opacity-60">
                ABOUT US
              </Link>
              <Link href={`/${locale}/journal`} className="text-[10px] uppercase tracking-[0.15em] font-medium transition-all hover:opacity-60">
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
                  className="text-[10px] uppercase tracking-[0.15em] font-medium transition-all hover:opacity-60"
                >
                   Instagram
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-[0.15em] font-medium transition-all hover:opacity-60"
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
               <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-foreground/30">Terms</span>
               <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-foreground/30">Privacy</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Merged into the flow, no border */}
        <div className="flex justify-between items-center pt-4">
          <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-foreground/30">
            © {currentYear} <span className="font-playfair text-xs lowercase">Ươm.</span>
          </p>
          <div className="flex gap-6 opacity-20">
             <span className="text-[8px] tracking-[0.5em] font-bold">VI</span>
             <span className="text-[8px] tracking-[0.5em] font-bold">EN</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
