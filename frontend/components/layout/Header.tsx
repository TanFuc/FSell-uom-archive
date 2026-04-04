'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Menu, Instagram, Facebook } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useLayoutEffect, memo } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { useProducts } from '@/hooks/use-products'
import { useBranding, useExchangeRate, useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import { cn, optimizeProductImage } from '@/lib/utils'

// Optimized Result Item
const SearchResultItem = memo(({ product, locale, exchangeRate, onClick }: any) => (
  <div className="group flex flex-col items-center space-y-3 text-center">
    <Link
      href={`/${locale}/shop/${product.slug}`}
      onClick={onClick}
      prefetch={false}
      className="relative block aspect-square w-24 overflow-hidden rounded-full border border-foreground/[0.03] bg-muted/5 md:w-28"
    >
      {product.images?.[0] && (
        <Image
          src={optimizeProductImage(product.images[0], { width: 320, height: 320 })}
          alt=""
          fill
          sizes="(max-width: 768px) 96px, 112px"
          className="object-cover"
        />
      )}
    </Link>
    <div className="max-w-[100px] space-y-0.5">
      <p className="line-clamp-1 text-[8px] font-bold uppercase tracking-widest">
        {locale === 'vi' ? product.nameVi : product.nameEn}
      </p>
      <p className="text-[7.5px] font-medium uppercase text-foreground/30">
        {getDisplayPrice(product, locale, exchangeRate).currentPrice}
      </p>
    </div>
  </div>
))
SearchResultItem.displayName = 'SearchResultItem'

export function Header() {
  const pathname = usePathname()
  const locale = useLocale() as 'vi' | 'en'
  const router = useRouter()
  const t = useTranslations('Navigation')
  const { data: branding } = useBranding()
  const { data: exchangeRate } = useExchangeRate()
  const { data: socialLinks } = useSocialLinks()

  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isPanelReady, setIsPanelReady] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const BRANDING_CACHE_KEY = 'uom_branding_cache'

  const getCachedBranding = () => {
    if (typeof window === 'undefined') return undefined
    try {
      const stored = localStorage.getItem(BRANDING_CACHE_KEY)
      if (!stored) return undefined
      return JSON.parse(stored) as {
        brandNameVi?: string
        brandNameEn?: string
        loadingText?: string
      }
    } catch {
      return undefined
    }
  }

  const [cachedBranding, setCachedBranding] = useState<
    { brandNameVi?: string; brandNameEn?: string; loadingText?: string } | undefined
  >(undefined)

  useEffect(() => {
    setCachedBranding(getCachedBranding())
  }, [branding?.brandNameVi, branding?.brandNameEn])

  const brandText =
    locale === 'vi'
      ? branding?.brandNameVi || cachedBranding?.brandNameVi || 'ƯƠM. Archive'
      : branding?.brandNameEn || cachedBranding?.brandNameEn || 'Uom Archive'
  const globalLoadingText = branding?.loadingText?.trim() || cachedBranding?.loadingText?.trim() || ''

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: categories } = useCategories(
    { includeInactive: false },
    { enabled: showSearch || showMobileMenu },
  )

  useLayoutEffect(() => {
    if (showSearch || showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setIsPanelReady(false)
    }
  }, [showSearch, showMobileMenu])

  useEffect(() => {
    setShowSearch(false)
    setShowMobileMenu(false)
  }, [pathname])

  const { data: suggestedProducts, isLoading: isSearching } = useProducts(
    {
      search: debouncedQuery,
      limit: 8,
      isActive: true,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    },
    {
      enabled: showSearch && debouncedQuery.trim().length >= 2,
    },
  )

  const { data: featuredSuggestions } = useProducts(
    {
      page: 1,
      limit: 4,
      isActive: true,
      isFeatured: true,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    },
    {
      enabled: showSearch,
    },
  )

  const { data: latestSuggestions } = useProducts(
    {
      page: 1,
      limit: 8,
      isActive: true,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    },
    {
      enabled: showSearch,
    },
  )

  const featuredList = featuredSuggestions?.data ?? []
  const latestList = latestSuggestions?.data ?? []
  const defaultSuggestions = [
    ...featuredList,
    ...latestList.filter((item) => !featuredList.some((featured) => featured.id === item.id)),
  ].slice(0, 4)
  const searchedSuggestions = (suggestedProducts?.data ?? []).slice(0, 4)
  const displaySuggestions =
    debouncedQuery.trim().length >= 2
      ? searchedSuggestions.length > 0
        ? searchedSuggestions
        : defaultSuggestions
      : defaultSuggestions

  const navigation = [
    { name: t('shop'), href: `/${locale}/shop` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('journal'), href: `/${locale}/journal` },
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

  const cubicBezier = [0.22, 1, 0.36, 1]

  const isHeaderOpaque = showSearch || showMobileMenu

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-500',
        isHeaderOpaque ? 'bg-white shadow-sm' : 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'relative z-[70] flex items-center bg-inherit px-6 transition-all duration-500 lg:px-12',
          isScrolled ? 'h-16 lg:h-20' : 'h-20 lg:h-28',
          isHeaderOpaque && !isScrolled ? 'border-b border-foreground/[0.03]' : 'border-b-0',
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left */}
          <div className="flex w-1/3 items-center">
            <button
              onClick={() => {
                setShowMobileMenu(!showMobileMenu)
                setShowSearch(false)
              }}
              className="group flex items-center gap-2 py-2 outline-none"
            >
              <div className="flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {showMobileMenu ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X
                        className={cn(
                          'transition-all duration-500',
                          isScrolled ? 'h-5 w-5 lg:h-6 lg:w-6' : 'h-6 w-6 lg:h-8 lg:w-8',
                        )}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu
                        className={cn(
                          'transition-all duration-500',
                          isScrolled ? 'h-5 w-5 lg:h-6 lg:w-6' : 'h-6 w-6 lg:h-8 lg:w-8',
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>

          {/* Middle Logo */}
          <div className="flex w-1/3 justify-center overflow-hidden">
            <Link
              href={`/${locale}`}
              className={cn(
                'font-playfair font-black tracking-tighter transition-all duration-500',
                'text-2xl lg:text-4xl',
                isScrolled
                  ? 'pointer-events-none -translate-y-8 scale-90 opacity-0 blur-sm'
                  : 'translate-y-0 opacity-100 hover:opacity-80',
              )}
              tabIndex={isScrolled ? -1 : 0}
              suppressHydrationWarning
            >
              {brandText}
            </Link>
          </div>

          {/* Right Socials + Search + Lang */}
          <div className="flex w-1/3 items-center justify-end gap-3 lg:gap-8">
            {/* Desktop Socials */}
            <div className="mr-2 hidden items-center gap-5 lg:flex">
              {socialLinks?.instagramUsername && (
                <a
                  href={`https://instagram.com/${socialLinks.instagramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-50"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks?.facebookPageUrl && (
                <a
                  href={socialLinks.facebookPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-50"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>

            <button
              onClick={() => {
                setShowSearch(!showSearch)
                setShowMobileMenu(false)
              }}
              className="flex items-center gap-2 py-1 outline-none"
            >
              {showSearch ? (
                <X className="h-5 w-5 lg:h-6 lg:w-6" />
              ) : (
                <Search className="h-5 w-5 lg:h-6 lg:w-6" />
              )}
              <span className="hidden text-xs font-bold uppercase leading-none tracking-widest lg:inline">
                {showSearch ? t('close') : t('search')}
              </span>
            </button>

            <Link
              href={newPath}
              className="flex h-full items-center text-xs font-bold uppercase leading-none tracking-widest lg:text-sm"
            >
              {switchLocale}
            </Link>
          </div>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              onAnimationComplete={() => setIsPanelReady(true)}
              transition={{ duration: 0.5, ease: cubicBezier }}
              className="absolute left-0 right-0 top-0 bg-[#fbfbfb] pt-16 shadow-2xl will-change-transform lg:pt-20"
            >
              <div className="mx-auto min-h-[300px] w-full max-w-[1100px] px-6 py-8 lg:px-12 lg:py-12">
                <motion.div
                  animate={isPanelReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSearch} className="relative mb-10">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={locale === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                      className="w-full border-b border-foreground/10 bg-transparent py-3 font-sans text-xl font-bold uppercase tracking-tight focus:border-primary/30 focus:outline-none lg:text-2xl"
                      autoFocus
                    />
                    {isSearching && searchQuery && globalLoadingText && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <span className="animate-pulse text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                          {globalLoadingText}
                        </span>
                      </div>
                    )}
                  </form>

                  <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                    <div className="md:col-span-3">
                      <h4 className="mb-6 text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/30">
                        SUGGESTED
                      </h4>
                      <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-4 md:gap-8">
                        {displaySuggestions.map((product) => (
                          <SearchResultItem
                            key={product.id}
                            product={product}
                            locale={locale}
                            exchangeRate={exchangeRate?.rate}
                            onClick={() => setShowSearch(false)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="mb-6 text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/30">
                        CATEGORIES
                      </h4>
                      <nav className="flex flex-col gap-3">
                        {categories?.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/${locale}/shop?categoryId=${cat.id}`}
                            onClick={() => setShowSearch(false)}
                            className="text-[10px] font-bold uppercase tracking-widest transition-all hover:pl-2"
                          >
                            {locale === 'vi' ? cat.nameVi : cat.nameEn}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIDE MENU */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              onAnimationComplete={() => setIsPanelReady(true)}
              transition={{ duration: 0.5, ease: cubicBezier }}
              className="absolute bottom-0 left-0 top-0 flex w-[85vw] max-w-[380px] flex-col bg-white pt-16 shadow-2xl will-change-transform lg:pt-20"
            >
              <div className="flex flex-1 flex-col justify-between px-8 py-12 lg:px-12">
                <motion.nav
                  animate={isPanelReady ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  className="flex flex-col space-y-6"
                >
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className="text-3xl font-bold uppercase tracking-tighter transition-all hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                </motion.nav>
                <motion.div
                  animate={isPanelReady ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-8"
                >
                  <div className="flex gap-6 text-foreground/40">
                    {socialLinks?.instagramUsername && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="h-5 w-5 transition-colors hover:text-foreground" />
                      </a>
                    )}
                    {socialLinks?.facebookPageUrl && (
                      <a
                        href={socialLinks.facebookPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="h-5 w-5 transition-colors hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/20">
                    Saigon / Vietnam
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
