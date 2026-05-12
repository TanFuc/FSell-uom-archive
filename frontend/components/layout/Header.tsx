'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Menu, Instagram, Facebook } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useLayoutEffect, memo, useMemo, useRef } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { useProducts } from '@/hooks/use-products'
import { useBranding, useExchangeRate, useSiteContent, useSocialLinks } from '@/hooks/use-settings'
import { getDisplayPrice } from '@/lib/currency'
import {
  parseTrendingTerms,
  SEARCH_TRENDING_EN_KEY,
  SEARCH_TRENDING_VI_KEY,
} from '@/lib/search-trending'
import { type Product } from '@/lib/types'
import { cn, optimizeProductImage } from '@/lib/utils'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return <>{text}</>
  }

  const escaped = escapeRegExp(normalizedQuery)
  const pattern = new RegExp(`(${escaped})`, 'ig')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase()
        if (!isMatch) {
          return <span key={`${part}-${index}`}>{part}</span>
        }

        return (
          <mark
            key={`${part}-${index}`}
            className="rounded-[4px] bg-[#ece7dc] px-1 py-[1px] text-foreground"
          >
            {part}
          </mark>
        )
      })}
    </>
  )
}

const SearchResultItem = memo(
  ({ product, locale, exchangeRate, onClick, query, isActive = false }: any) => {
    const productName = locale === 'vi' ? product.nameVi : product.nameEn

    return (
      <Link
        href={`/${locale}/shop/${product.slug}`}
        onClick={onClick}
        prefetch={false}
        className={cn(
          'group block rounded-2xl border border-foreground/[0.08] bg-[linear-gradient(160deg,#ffffff_0%,#faf8f2_100%)] p-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_18px_34px_rgba(0,0,0,0.15)]',
          isActive &&
            'border-foreground/45 bg-[linear-gradient(160deg,#fffdfa_0%,#f4ecdd_100%)] shadow-[0_0_0_2px_rgba(66,56,42,0.16),0_16px_34px_rgba(0,0,0,0.15)]',
        )}
      >
        <div className="relative mx-auto mb-3 aspect-square w-20 overflow-hidden rounded-full border border-foreground/[0.08] bg-muted/5 md:w-24">
          {product.images?.[0] && (
            <Image
              src={optimizeProductImage(product.images[0], { width: 320, height: 320 })}
              alt={
                locale === 'vi'
                  ? `${productName} - Gợi ý tìm kiếm ƯƠM. Archive`
                  : `${productName} - Search suggestion by ƯƠM.`
              }
              fill
              sizes="(max-width: 768px) 80px, 96px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="space-y-1">
          <p className="line-clamp-2 min-h-[2.15rem] text-[9px] font-bold uppercase leading-tight tracking-[0.13em] text-foreground/90">
            <HighlightedText
              text={locale === 'vi' ? product.nameVi : product.nameEn}
              query={query}
            />
          </p>
          <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
            {getDisplayPrice(product, locale, exchangeRate).currentPrice}
          </p>
        </div>
      </Link>
    )
  },
)
SearchResultItem.displayName = 'SearchResultItem'

function SearchSkeletonItem() {
  return (
    <div className="rounded-2xl border border-foreground/[0.08] bg-white/90 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
      <div className="mx-auto mb-3 h-20 w-20 animate-pulse rounded-full bg-gradient-to-r from-[#ece8df] via-[#f5f2eb] to-[#ece8df] bg-[length:220%_100%] md:h-24 md:w-24" />
      <div className="space-y-2">
        <div className="h-2 animate-pulse rounded bg-gradient-to-r from-[#ece8df] via-[#f5f2eb] to-[#ece8df] bg-[length:220%_100%]" />
        <div className="mx-auto h-2 w-2/3 animate-pulse rounded bg-gradient-to-r from-[#ece8df] via-[#f5f2eb] to-[#ece8df] bg-[length:220%_100%]" />
      </div>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const locale = useLocale() as 'vi' | 'en'
  const router = useRouter()
  const t = useTranslations('Navigation')
  const { data: branding } = useBranding()
  const { data: exchangeRate } = useExchangeRate()
  const { data: socialLinks } = useSocialLinks()
  const { data: siteContent } = useSiteContent()

  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isPanelReady, setIsPanelReady] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const activeCardRefs = useRef<Array<HTMLDivElement | null>>([])
  const scrollLockYRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const BRANDING_CACHE_KEY = 'uom_branding_cache'
  const RECENT_SEARCHES_KEY = `uom_recent_searches_${locale}`

  const normalizeSearchTerm = (value: string) => value.trim().replace(/\s+/g, ' ')

  const addRecentSearch = (value: string) => {
    const normalized = normalizeSearchTerm(value)
    if (normalized.length < 2 || typeof window === 'undefined') {
      return
    }

    setRecentSearches((prev) => {
      const next = [
        normalized,
        ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
      ].slice(0, 8)

      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch {}

      return next
    })
  }

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
      ? branding?.brandNameVi || cachedBranding?.brandNameVi || 'ƯƠM.'
      : branding?.brandNameEn || cachedBranding?.brandNameEn || 'ƯƠM.'
  const globalLoadingText =
    branding?.loadingText?.trim() || cachedBranding?.loadingText?.trim() || ''

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!raw) {
        setRecentSearches([])
        return
      }

      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item) => (typeof item === 'string' ? normalizeSearchTerm(item) : ''))
          .filter((item) => item.length >= 2)
          .slice(0, 8)
        setRecentSearches(normalized)
        return
      }
    } catch {}

    setRecentSearches([])
  }, [RECENT_SEARCHES_KEY])

  const { data: categories } = useCategories({ includeInactive: false }, { enabled: showSearch })

  useLayoutEffect(() => {
    if (!showSearch && !showMobileMenu) {
      setIsPanelReady(false)
      return
    }

    scrollLockYRef.current = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      const scrollY = scrollLockYRef.current
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
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

  const { data: featuredSuggestions, isLoading: isFeaturedLoading } = useProducts(
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

  const { data: latestSuggestions, isLoading: isLatestLoading } = useProducts(
    {
      page: 1,
      limit: 40,
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
  const normalizedDebouncedQuery = useMemo(
    () => normalizeSearchText(debouncedQuery),
    [debouncedQuery],
  )

  const searchCandidatePool = useMemo(() => {
    const merged = [...(suggestedProducts?.data ?? []), ...featuredList, ...latestList]

    return merged.filter(
      (item, index) => merged.findIndex((candidate) => candidate.id === item.id) === index,
    )
  }, [featuredList, latestList, suggestedProducts?.data])

  const hasQuery = normalizedDebouncedQuery.length >= 2
  const isQueryEmpty = normalizedDebouncedQuery.length === 0

  const foundSuggestions = useMemo(() => {
    if (!hasQuery) {
      return []
    }

    const tokens = normalizedDebouncedQuery.split(' ').filter(Boolean)
    if (tokens.length === 0) {
      return []
    }

    return searchCandidatePool
      .filter((product) => {
        const searchableContent = normalizeSearchText(
          [
            product.nameVi,
            product.nameEn,
            product.slug,
            product.shortDescriptionVi,
            product.shortDescriptionEn,
            product.material,
          ]
            .filter(Boolean)
            .join(' '),
        )

        return tokens.every((token) => searchableContent.includes(token))
      })
      .slice(0, 8)
  }, [hasQuery, normalizedDebouncedQuery, searchCandidatePool])

  const defaultSuggestions = [
    ...featuredList,
    ...latestList.filter(
      (item: Product) => !featuredList.some((featured: Product) => featured.id === item.id),
    ),
  ].slice(0, 4)
  const suggestedSuggestions = hasQuery
    ? defaultSuggestions.filter(
        (item: Product) => !foundSuggestions.some((found: Product) => found.id === item.id),
      )
    : defaultSuggestions
  const keyboardSuggestions = hasQuery ? foundSuggestions : suggestedSuggestions
  const isSearchLoading = hasQuery && isSearching
  const resultBatchKey = useMemo(() => {
    const ids = keyboardSuggestions.map((product) => product.id).join('-')
    return `${normalizedDebouncedQuery}|${ids}`
  }, [keyboardSuggestions, normalizedDebouncedQuery])

  const trendingSearches = useMemo(
    () =>
      parseTrendingTerms(
        siteContent?.[locale === 'vi' ? SEARCH_TRENDING_VI_KEY : SEARCH_TRENDING_EN_KEY],
        locale,
      ),
    [locale, siteContent],
  )

  useEffect(() => {
    setActiveSearchIndex(-1)
  }, [debouncedQuery, showSearch])

  useEffect(() => {
    if (activeSearchIndex < 0 || !showSearch) {
      return
    }

    const node = activeCardRefs.current[activeSearchIndex]
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [activeSearchIndex, resultBatchKey, showSearch])

  const navigation = [
    { name: t('shop'), href: `/${locale}/shop` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('journal'), href: `/${locale}/journal` },
  ]

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const newPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  const closeSearchPanel = () => {
    setIsPanelReady(false)
    setShowSearch(false)
    if (typeof document !== 'undefined') {
      const active = document.activeElement as HTMLElement | null
      active?.blur()
    }
  }

  const closeMobileMenu = () => {
    setShowMobileMenu(false)
  }

  const toggleMobileMenu = () => {
    if (showMobileMenu) {
      closeMobileMenu()
      return
    }

    setIsPanelReady(false)
    setShowSearch(false)
    setShowMobileMenu(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery)
      router.push(`/${locale}/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      closeSearchPanel()
      setSearchQuery('')
    }
  }

  const navigateToSuggestion = (index: number) => {
    const target = keyboardSuggestions[index]
    if (!target) return
    addRecentSearch(searchQuery || debouncedQuery)
    router.push(`/${locale}/shop/${target.slug}`)
    closeSearchPanel()
    setSearchQuery('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeSearchPanel()
      return
    }

    if (!keyboardSuggestions.length) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSearchIndex((prev) => (prev + 1) % keyboardSuggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSearchIndex((prev) => (prev <= 0 ? keyboardSuggestions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Enter' && activeSearchIndex >= 0) {
      e.preventDefault()
      navigateToSuggestion(activeSearchIndex)
    }
  }

  const cubicBezier = [0.22, 1, 0.36, 1]
  const listStagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
  }
  const itemRise = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: cubicBezier },
    },
  }

  const isHeaderOpaque = showMobileMenu
  const panelOffsetClass = isScrolled ? 'top-16 lg:top-20' : 'top-20 lg:top-28'

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-colors duration-200',
        isHeaderOpaque ? 'bg-white shadow-sm' : 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'relative z-[70] flex items-center bg-inherit px-6 transition-[height,border-color] duration-200 lg:px-12',
          isScrolled ? 'h-16 lg:h-20' : 'h-20 lg:h-28',
          isHeaderOpaque && !isScrolled ? 'border-b border-foreground/[0.03]' : 'border-b-0',
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left */}
          <div className="flex w-1/3 items-center">
            <button
              onClick={toggleMobileMenu}
              aria-label={showMobileMenu ? t('closeMenu') : t('openMenu')}
              className="group flex items-center gap-2 py-2 outline-none"
            >
              <div className="flex items-center justify-center">
                <AnimatePresence initial={false}>
                  {showMobileMenu ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.08 }}
                    >
                      <X
                        className={cn(
                          'transition-[height,width] duration-200',
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
                      transition={{ duration: 0.08 }}
                    >
                      <Menu
                        className={cn(
                          'transition-[height,width] duration-200',
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
                'font-playfair font-bold tracking-tighter transition-all duration-500',
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
                  className="transition-opacity hover:opacity-50"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>

            <button
              onClick={() => {
                showSearch ? closeSearchPanel() : setShowSearch(true)
                setShowMobileMenu(false)
              }}
              className="flex items-center gap-2 py-1 outline-none"
              aria-label={showSearch ? t('closeSearch') : t('openSearch')}
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
              aria-label={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              {switchLocale}
            </Link>
          </div>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-40">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.46)_0%,rgba(0,0,0,0.62)_100%)] backdrop-blur-[3px]"
              onClick={closeSearchPanel}
            />
            <motion.div
              initial={{ y: '-10%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-10%', opacity: 0 }}
              onAnimationComplete={() => setIsPanelReady(true)}
              transition={{ duration: 0.35, ease: cubicBezier }}
              className={cn(
                'absolute inset-x-0 bottom-0 overflow-y-auto px-3 pb-4 will-change-transform md:px-6 md:pb-6',
                panelOffsetClass,
              )}
            >
              <div className="relative mx-auto w-full max-w-[1160px] overflow-hidden rounded-2xl border border-black/10 bg-[#fcfcfa] shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
                <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#d7cab3]/45 blur-3xl" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-[#e7dfcf]/55 blur-3xl" />
                <motion.div
                  animate={isPanelReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="relative min-h-[300px] px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-9"
                >
                  <form
                    onSubmit={handleSearch}
                    className="relative mb-8 rounded-xl border border-foreground/10 bg-white px-4 py-3 shadow-sm transition-all duration-300 focus-within:border-foreground/30 focus-within:shadow-[0_10px_26px_rgba(0,0,0,0.08)] md:px-5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-foreground/35">
                        {locale === 'vi' ? 'Tìm Kiếm Nhanh' : 'Quick Search'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] uppercase tracking-[0.22em] text-foreground/30">
                          {hasQuery
                            ? `${foundSuggestions.length} ${locale === 'vi' ? 'kết quả' : 'results'}`
                            : 'ENTER'}
                        </p>
                        <button
                          type="button"
                          onClick={closeSearchPanel}
                          className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground/55 transition-all hover:border-foreground/35 hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                          {t('close')}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 shrink-0 text-foreground/35" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder={
                          locale === 'vi'
                            ? 'Nhập tên sản phẩm, chất liệu...'
                            : 'Type product name, material...'
                        }
                        className="w-full bg-transparent py-1.5 font-sans text-base font-semibold tracking-[0.01em] text-foreground placeholder:text-foreground/35 focus:outline-none md:text-lg"
                        autoFocus
                        aria-label={locale === 'vi' ? 'Nhập nội dung tìm kiếm' : 'Search query'}
                      />
                    </div>
                    {isSearching && searchQuery && globalLoadingText && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="animate-pulse text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
                          {globalLoadingText}
                        </span>
                      </div>
                    )}
                  </form>

                  <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                    <div className="md:col-span-3">
                      {isQueryEmpty && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 rounded-xl border border-foreground/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.95)_0%,rgba(244,237,224,0.95)_100%)] p-4 shadow-sm"
                        >
                          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.28em] text-foreground/40">
                            {locale === 'vi' ? 'Trending Searches' : 'Trending Searches'}
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {trendingSearches.map((term) => (
                              <button
                                key={term}
                                type="button"
                                onClick={() => setSearchQuery(term)}
                                className="rounded-full border border-foreground/15 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-foreground/35 hover:text-foreground"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {isQueryEmpty && recentSearches.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 }}
                          className="mb-6 rounded-xl border border-foreground/10 bg-white/90 p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-foreground/40">
                              {locale === 'vi' ? 'Recent Searches' : 'Recent Searches'}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setRecentSearches([])
                                if (typeof window !== 'undefined') {
                                  try {
                                    window.localStorage.removeItem(RECENT_SEARCHES_KEY)
                                  } catch {}
                                }
                              }}
                              className="border-foreground/12 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/45 transition-colors hover:border-foreground/30 hover:text-foreground"
                            >
                              {locale === 'vi' ? 'Xóa' : 'Clear'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {recentSearches.map((term) => (
                              <button
                                key={`recent-${term}`}
                                type="button"
                                onClick={() => setSearchQuery(term)}
                                className="rounded-full border border-foreground/15 bg-[#f9f6ef] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-foreground/35 hover:text-foreground"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {hasQuery && (
                        <>
                          <div className="mb-5 flex items-center justify-between gap-3">
                            <h4 className="text-[9px] font-bold uppercase tracking-[0.34em] text-foreground/35">
                              {locale === 'vi' ? 'KẾT QUẢ TÌM ĐƯỢC' : 'FOUND RESULTS'}
                            </h4>
                            <span className="rounded-full border border-foreground/15 bg-white/80 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/40">
                              {foundSuggestions.length}
                            </span>
                          </div>

                          <AnimatePresence mode="wait" initial={false}>
                            {isSearchLoading ? (
                              <motion.div
                                key={`skeleton-${debouncedQuery}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22 }}
                                className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
                              >
                                {Array.from({ length: 4 }).map((_, idx) => (
                                  <SearchSkeletonItem key={`sk-${idx}`} />
                                ))}
                              </motion.div>
                            ) : foundSuggestions.length > 0 ? (
                              <motion.div
                                key={`results-${resultBatchKey}`}
                                variants={listStagger}
                                initial="hidden"
                                animate={isPanelReady ? 'show' : 'hidden'}
                                exit={{ opacity: 0, y: -8 }}
                                className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
                              >
                                {foundSuggestions.map((product, index) => (
                                  <motion.div
                                    key={`${product.id}-${resultBatchKey}`}
                                    variants={itemRise}
                                    initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -6, filter: 'blur(8px)' }}
                                    transition={{ duration: 0.26, ease: cubicBezier }}
                                    ref={(node) => {
                                      activeCardRefs.current[index] = node
                                    }}
                                  >
                                    <SearchResultItem
                                      product={product}
                                      locale={locale}
                                      exchangeRate={exchangeRate?.rate}
                                      onClick={() => {
                                        addRecentSearch(searchQuery || debouncedQuery)
                                        closeSearchPanel()
                                      }}
                                      query={debouncedQuery}
                                      isActive={activeSearchIndex === index}
                                    />
                                  </motion.div>
                                ))}
                              </motion.div>
                            ) : (
                              <motion.p
                                key={`empty-${debouncedQuery}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mb-8 rounded-lg border border-dashed border-foreground/15 bg-white/70 px-4 py-4 text-xs uppercase tracking-[0.16em] text-foreground/45"
                              >
                                {locale === 'vi'
                                  ? 'Không tìm thấy kết quả phù hợp.'
                                  : 'No matching results found.'}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      <div className="mb-5 flex items-center justify-between gap-3 border-t border-foreground/10 pt-5">
                        <h4 className="text-[9px] font-bold uppercase tracking-[0.34em] text-foreground/35">
                          {locale === 'vi' ? 'GỢI Ý' : 'SUGGESTED'}
                        </h4>
                        {hasQuery && (
                          <span className="rounded-full border border-foreground/15 bg-white/80 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/40">
                            {locale === 'vi' ? 'Đề xuất thêm' : 'More to explore'}
                          </span>
                        )}
                      </div>

                      {suggestedSuggestions.length > 0 || isLatestLoading || isFeaturedLoading ? (
                        <AnimatePresence mode="wait">
                          {isLatestLoading || isFeaturedLoading ? (
                            <motion.div
                              key="suggested-skeleton"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
                            >
                              {Array.from({ length: 4 }).map((_, idx) => (
                                <SearchSkeletonItem key={`suggested-sk-${idx}`} />
                              ))}
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`suggested-${resultBatchKey}`}
                              variants={listStagger}
                              initial="hidden"
                              animate="show"
                              className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4"
                            >
                              {suggestedSuggestions.map((product) => (
                                <motion.div
                                  key={`suggested-${product.id}-${resultBatchKey}`}
                                  variants={itemRise}
                                  initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
                                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                  transition={{ duration: 0.26, ease: cubicBezier }}
                                >
                                  <SearchResultItem
                                    product={product}
                                    locale={locale}
                                    exchangeRate={exchangeRate?.rate}
                                    onClick={() => {
                                      addRecentSearch(searchQuery || debouncedQuery)
                                      closeSearchPanel()
                                    }}
                                    query={debouncedQuery}
                                    isActive={false}
                                  />
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ) : (
                        <p className="rounded-lg border border-dashed border-foreground/15 bg-white/70 px-4 py-4 text-xs uppercase tracking-[0.16em] text-foreground/45">
                          {locale === 'vi' ? 'Chưa có gợi ý phù hợp.' : 'No suggestions yet.'}
                        </p>
                      )}
                    </div>
                    <div className="space-y-5">
                      <h4 className="mb-5 text-[9px] font-bold uppercase tracking-[0.34em] text-foreground/35">
                        CATEGORIES
                      </h4>
                      <motion.nav
                        variants={listStagger}
                        initial="hidden"
                        animate={isPanelReady ? 'show' : 'hidden'}
                        className="flex flex-wrap gap-2 md:flex-col md:gap-2.5"
                      >
                        {categories?.map((cat) => (
                          <motion.div key={cat.id} variants={itemRise}>
                            <Link
                              href={`/${locale}/shop?categoryId=${cat.id}`}
                              onClick={closeSearchPanel}
                              className="border-foreground/12 block rounded-full border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all hover:border-foreground/35 hover:bg-foreground hover:text-white md:w-fit"
                            >
                              {locale === 'vi' ? cat.nameVi : cat.nameEn}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.nav>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIDE MENU */}
      <AnimatePresence initial={false}>
        {showMobileMenu && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 bg-black/30"
              onClick={closeMobileMenu}
            />
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.16, ease: cubicBezier }}
              className="absolute bottom-0 left-0 top-0 flex w-[85vw] max-w-[380px] flex-col bg-white pt-16 shadow-2xl lg:pt-20"
            >
              <div className="flex flex-1 flex-col justify-between px-8 py-12 lg:px-12">
                <nav className="flex flex-col space-y-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="text-3xl font-bold uppercase tracking-tighter transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="space-y-8">
                  <div className="flex gap-6 text-foreground/40">
                    {socialLinks?.instagramUsername && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5 transition-colors hover:text-foreground" />
                      </a>
                    )}
                    {socialLinks?.facebookPageUrl && (
                      <a
                        href={socialLinks.facebookPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5 transition-colors hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/20">
                    Saigon / Vietnam
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
