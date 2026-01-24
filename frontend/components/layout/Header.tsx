'use client'

import { Search, X, Loader2, Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useLayoutEffect } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { useProducts } from '@/hooks/use-products'
import { cn, formatPriceVND } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const locale = useLocale() as 'vi' | 'en'
  const router = useRouter()
  const t = useTranslations('Navigation')
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: categories } = useCategories({ includeInactive: false })

  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  // Prevent scroll when search or mobile menu is open
  useLayoutEffect(() => {
    if (showSearch || showMobileMenu) {
      const sbWidth = window.innerWidth - document.documentElement.clientWidth
      setScrollbarWidth(sbWidth)
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${sbWidth}px`
    } else {
      setScrollbarWidth(0)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [showSearch, showMobileMenu])

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  // Fetch suggested products
  const { data: suggestedProducts, isLoading: isSearching } = useProducts({
    search: debouncedQuery,
    limit: 6,
    isActive: true,
  })

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
    <header
      style={{ paddingRight: `${scrollbarWidth}px` }}
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-[height,background-color,border-color,box-shadow] duration-500',
        showSearch
          ? 'h-screen bg-black shadow-2xl lg:h-20'
          : showMobileMenu
            ? 'h-16 border-b border-foreground/5 bg-background shadow-sm lg:h-20'
            : 'h-16 border-b border-foreground/5 bg-background backdrop-blur-md lg:h-20',
      )}
    >
      <div className="container-custom flex h-16 items-center justify-between lg:h-20">
        {!showSearch ? (
          <>
            {/* Logo */}
            <Link
              href={`/${locale}`}
              className="z-[60] font-playfair text-2xl font-bold tracking-widest text-foreground transition-opacity duration-300 hover:opacity-80 lg:text-3xl xl:text-4xl"
            >
              ƯƠM<span className="text-black">.</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link text-xs xl:text-sm ${
                    pathname === item.href
                      ? 'underline decoration-primary decoration-2 underline-offset-8'
                      : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Categories Dropdown */}
              <div className="group relative flex h-full items-center">
                <button className="nav-link flex items-center gap-1 py-2 text-xs transition-opacity group-hover:opacity-70 xl:text-sm">
                  {locale === 'vi' ? 'DANH MỤC' : 'CATEGORIES'}
                </button>

                <div className="invisible absolute -left-4 top-full z-[60] w-56 translate-y-2 border-[0.5px] border-foreground/20 bg-white py-4 opacity-0 shadow-xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <nav className="flex flex-col">
                    {categories?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${locale}/shop?categoryId=${category.id}`}
                        className="flex items-center gap-3 border-l-2 border-transparent px-6 py-3 text-[11px] uppercase tracking-widest text-foreground transition-all duration-300 hover:border-primary hover:bg-muted/30 hover:pl-8"
                      >
                        {category.image && (
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                            <Image src={category.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                        {locale === 'vi' ? category.nameVi : category.nameEn}
                      </Link>
                    ))}
                    <div className="mx-6 my-2 h-px bg-foreground/5" />
                    <Link
                      href={`/${locale}/shop`}
                      className="px-6 py-2.5 text-[10px] uppercase italic tracking-widest text-muted-foreground transition-all duration-300 hover:text-foreground"
                    >
                      {locale === 'vi' ? 'Xem tất cả' : 'View All'}
                    </Link>
                  </nav>
                </div>
              </div>

              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch(true)}
                className="nav-link flex items-center gap-2 p-1 transition-colors hover:text-primary"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden text-[10px] tracking-widest xl:inline">SEARCH</span>
              </button>

              {/* Language switcher */}
              <Link href={newPath} className="nav-link text-[11px] font-bold" scroll={false}>
                {switchLocale.toUpperCase()}
              </Link>
            </nav>

            {/* Mobile/Tablet Actions */}
            <div className="flex items-center gap-4 lg:hidden">
              <button
                onClick={() => {
                  setShowSearch(true)
                  setShowMobileMenu(false)
                }}
                className="rounded-full p-2 transition-colors hover:bg-black/5"
              >
                <Search className="h-5 w-5 text-foreground" />
              </button>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="rounded-full p-2 transition-colors hover:bg-black/5"
                aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Header Search Mode - Active */
          <div className="flex w-full items-center gap-4 duration-500 animate-in fade-in slide-in-from-top-4 lg:gap-8">
            <p className="hidden shrink-0 text-[10px] font-medium uppercase tracking-[0.4em] text-primary lg:block">
              {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
            </p>
            <form onSubmit={handleSearch} className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'vi' ? 'Nhập tên sản phẩm...' : 'Type to search...'}
                className="w-full border-b border-white/10 bg-transparent py-2 font-playfair text-lg italic text-white transition-all duration-500 placeholder:text-white/10 focus:outline-none lg:text-2xl"
                autoFocus
              />
              {isSearching && searchQuery && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary/50" />
                </div>
              )}
            </form>
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="p-2 transition-opacity hover:opacity-50"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer (Right Side) */}
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[49] lg:hidden', // Reduced z-index to be below header
          showMobileMenu ? 'pointer-events-auto' : '',
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500',
            showMobileMenu ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setShowMobileMenu(false)}
        />

        {/* Drawer Panel */}
        <div
          className={cn(
            'absolute right-0 top-16 flex h-[calc(100vh-4rem)] w-full flex-col border-l border-white/5 bg-background shadow-2xl transition-transform duration-500 ease-out md:w-[400px]',
            showMobileMenu ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* Search in Menu */}
          <div className="shrink-0 px-6 py-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch(e)
                setShowMobileMenu(false)
              }}
              className="group relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search for products...'}
                className="w-full rounded-xl border border-transparent bg-muted/40 px-10 py-3 text-sm transition-all placeholder:text-muted-foreground/60 hover:bg-muted/60 focus:border-primary/20 focus:outline-none"
              />
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-primary" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 scale-90 rounded-lg bg-background p-1.5 opacity-0 shadow-sm transition-all group-focus-within:scale-100 group-focus-within:opacity-100"
              >
                <span className="sr-only">Search</span>
                <Search className="h-3 w-3" />
              </button>
            </form>
          </div>

          {/* Menu Content */}
          <div className="scrollbar-hide flex-1 space-y-8 overflow-y-auto px-6 py-6">
            {/* Main Links */}
            <nav className="flex flex-col space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-4 py-3 font-playfair text-2xl italic transition-all duration-300',
                    pathname === item.href
                      ? 'bg-primary/5 pl-6 text-primary'
                      : 'text-foreground hover:bg-muted/50 hover:pl-6',
                  )}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Visual Divider */}
            <div className="relative py-2">
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-foreground/10" />
              <span className="relative z-10 ml-4 bg-background px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {locale === 'vi' ? 'BST Theo Danh mục' : 'Shop by Category'}
              </span>
            </div>

            {/* Categories Grid/List */}
            <div className="grid gap-3">
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/shop?categoryId=${category.id}`}
                  onClick={() => setShowMobileMenu(false)}
                  className="group flex items-center gap-4 rounded-xl p-2 transition-all duration-300 hover:bg-muted/40"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm transition-all group-hover:shadow-md">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted font-playfair text-lg italic text-muted-foreground/50">
                        {category.nameEn.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium uppercase tracking-widest text-foreground/90 transition-colors group-hover:text-primary">
                      {locale === 'vi' ? category.nameVi : category.nameEn}
                    </span>
                    <span className="font-lora text-[10px] italic text-muted-foreground">
                      {locale === 'vi' ? 'Khám phá ngay' : 'Explore now'}
                    </span>
                  </div>
                  <div className="ml-auto -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10">
                      <span className="text-[10px]">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="shrink-0 border-t border-foreground/5 bg-muted/5 p-6">
            <Link
              href={newPath}
              className="group flex items-center justify-between rounded-lg border border-foreground/5 bg-background/50 p-3 transition-all duration-300 hover:bg-background hover:shadow-sm"
              scroll={false}
            >
              <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold">
                  {locale.toUpperCase()}
                </span>
                {locale === 'vi' ? 'Đổi Ngôn ngữ' : 'Switch Language'}
              </span>
              <span className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                {switchLocale.toUpperCase()}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Dropdown Results */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-[2px]"
          onClick={() => setShowSearch(false)}
        />
      )}

      {showSearch && (
        <div className="absolute left-0 top-full max-h-[calc(100vh-80px)] w-full overflow-hidden border-t border-white/5 bg-[#1a1a1a] shadow-2xl duration-500 animate-in slide-in-from-top-2">
          <div className="container-custom px-4 py-8 md:px-8 md:py-12">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
              {/* Left Column: Products */}
              <div className="space-y-6 md:space-y-8">
                <h3 className="border-b border-white/5 pb-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                  {locale === 'vi' ? 'Sản phẩm gợi ý' : 'Suggested Products'}
                </h3>

                <div className="scrollbar-hide max-h-[40vh] space-y-6 overflow-y-auto pr-4">
                  {!searchQuery && (
                    <p className="font-lora text-[11px] italic text-white/20">
                      {locale === 'vi' ? 'Gõ để bắt đầu tìm kiếm...' : 'Start typing to search...'}
                    </p>
                  )}
                  {searchQuery && suggestedProducts?.data.length === 0 && !isSearching && (
                    <p className="font-lora text-[11px] italic text-white/20">
                      {locale === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'}
                    </p>
                  )}
                  {suggestedProducts?.data.map((product) => (
                    <Link
                      key={product.id}
                      href={`/${locale}/shop/${product.slug}`}
                      onClick={() => setShowSearch(false)}
                      className="group flex items-center gap-6 border-b border-white/5 pb-4 transition-all duration-500 last:border-0 hover:border-primary/30"
                    >
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-white/5 grayscale transition-all duration-700 group-hover:grayscale-0">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.nameVi}
                            fill
                            className="object-cover opacity-60 transition-opacity group-hover:opacity-100"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="line-clamp-2 text-[11px] uppercase tracking-widest text-white/60 transition-colors group-hover:text-primary">
                          {locale === 'vi' ? product.nameVi : product.nameEn}
                        </h4>
                        <p className="font-lora text-[10px] text-white/30">
                          {formatPriceVND(product.priceVND)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Column: Categories */}
              <div className="hidden space-y-6 md:block md:space-y-8">
                <h3 className="border-b border-white/5 pb-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                  {locale === 'vi' ? 'Danh mục tinh túy' : 'Curated Categories'}
                </h3>
                <div className="flex flex-col gap-4">
                  {categories?.map((category) => (
                    <Link
                      key={category.id}
                      href={`/${locale}/shop?categoryId=${category.id}`}
                      onClick={() => setShowSearch(false)}
                      className="group flex items-center gap-4 pt-2"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/5 bg-white/5 grayscale transition-all duration-700 group-hover:grayscale-0">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.nameVi}
                            fill
                            className="object-cover opacity-60 transition-all group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] italic text-white/20">
                            {(locale === 'vi' ? category.nameVi : category.nameEn).charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] uppercase tracking-[0.2em] text-white/40 transition-all duration-500 group-hover:text-primary">
                        {locale === 'vi' ? category.nameVi : category.nameEn}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center border-t border-white/5 pt-8 md:mt-12">
              <button
                onClick={() => setShowSearch(false)}
                className="text-[9px] uppercase tracking-[0.6em] text-white/20 transition-colors hover:text-white/50"
              >
                {locale === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
