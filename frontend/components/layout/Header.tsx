'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

export function Header() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Navigation')

  const navigation = [
    { name: t('shop'), href: `/${locale}/shop` },
    { name: t('about'), href: `/${locale}/about` },
  ]

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const newPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-foreground/10">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="nav-link text-base md:text-lg">
            ƯƠM ARCHIVE
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 md:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  pathname === item.href ? 'italic' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Language switcher */}
            <Link href={newPath} className="nav-link">
              {switchLocale.toUpperCase()}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
