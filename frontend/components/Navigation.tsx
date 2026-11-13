'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Logo from './Logo'

export default function Navigation() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <>
      {/* Top Left - Logo/Brand */}
      <div className="fixed left-6 top-6 z-50">
        <Logo variant="text" />
      </div>

      {/* Top Right - Language Toggle */}
      <div className="fixed right-6 top-6 z-50 flex items-center gap-2">
        <button
          onClick={() => switchLocale('vi')}
          className={`nav-link ${locale === 'vi' ? 'italic' : ''}`}
        >
          VN
        </button>
        <span className="text-foreground/20">|</span>
        <button
          onClick={() => switchLocale('en')}
          className={`nav-link ${locale === 'en' ? 'italic' : ''}`}
        >
          EN
        </button>
      </div>

      {/* Bottom Left - Shop */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href={`/${locale}/shop`} className="nav-link">
          {t('shop')}
        </Link>
      </div>

      {/* Bottom Right - Instagram */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://instagram.com/uomarchive"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          INSTAGRAM
        </a>
      </div>
    </>
  )
}
