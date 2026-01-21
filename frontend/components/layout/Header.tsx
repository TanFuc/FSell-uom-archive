'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('Navigation')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const navigation = [
    { name: t('shop'), href: `/${locale}/shop` },
    { name: t('about'), href: `/${locale}/about` },
  ]

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const newPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${locale}/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/15 backdrop-blur-sm border-b border-foreground/10">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="font-playfair font-bold text-3xl md:text-4xl tracking-widest text-foreground hover:opacity-80 transition-opacity duration-300">
            ƯƠM<span className="text-primary">.</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 md:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  pathname === item.href ? 'underline underline-offset-4 decoration-1' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Search Icon */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="nav-link p-1 hover:opacity-70 transition-opacity"
              aria-label="Search"
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Language switcher */}
            <Link href={newPath} className="nav-link" scroll={false}>
              {switchLocale.toUpperCase()}
            </Link>
          </nav>
        </div>

        {/* Search Bar - Expandable */}
        {showSearch && (
          <div className="pb-4 animate-slide-up">
            <form onSubmit={handleSearch} className="max-w-md ml-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
                className="input w-full"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
