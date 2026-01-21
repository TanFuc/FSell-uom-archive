'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useSocialLinks } from '@/hooks/use-settings'
import { Instagram, Facebook } from 'lucide-react'

export function Footer() {
  const locale = useLocale()
  const t = useTranslations('Footer')
  const { data: socialLinks } = useSocialLinks()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="container-custom spacing-md">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Brand */}
          <div>
            <h3 className="uppercase tracking-wider mb-4">ƯƠM ARCHIVE</h3>
            <p className="text-muted-foreground max-w-xs">
              {t('description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="uppercase tracking-wider mb-4">{t('navigation')}</h4>
            <nav className="flex flex-col gap-2">
              <Link href={`/${locale}/shop`} className="text-link">
                {t('shop')}
              </Link>
              <Link href={`/${locale}/about`} className="text-link">
                {t('about')}
              </Link>
            </nav>
          </div>

          {/* Social */}
          <div>
            <h4 className="uppercase tracking-wider mb-4">{t('connect')}</h4>
            <div className="flex gap-4">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-60 transition-opacity"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-60 transition-opacity"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-foreground/10 text-center md:text-left">
          <p className="text-muted-foreground">
            © {currentYear} Ươm Archive. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
