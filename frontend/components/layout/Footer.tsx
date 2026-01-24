'use client'

import { Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useCategories } from '@/hooks/use-categories'
import { useSocialLinks } from '@/hooks/use-settings'

export function Footer() {
  const locale = useLocale() as 'vi' | 'en'
  const t = useTranslations('Footer')
  const { data: socialLinks } = useSocialLinks()
  const { data: categories } = useCategories({ includeInactive: false })

  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-foreground/5 bg-background">
      <div className="container-custom spacing-md">
        {/* Main Footer Content */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <div>
            <Link
              href={`/${locale}`}
              className="mb-4 inline-block font-playfair text-3xl font-bold tracking-widest text-foreground transition-opacity duration-300 hover:opacity-80 md:text-4xl"
            >
              ƯƠM<span className="text-black">.</span>
            </Link>
            <p className="max-w-xs text-muted-foreground">{t('description')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 uppercase tracking-wider">{t('navigation')}</h4>
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
            <h4 className="mb-4 uppercase tracking-wider">{t('connect')}</h4>
            <div className="flex gap-4">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-60"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-60"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-foreground/5 pt-8 text-center md:text-left">
          <p className="text-muted-foreground">
            © {currentYear} Ươm Archive. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
