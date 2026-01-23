'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Search, X, Loader2, Menu } from 'lucide-react'
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
      "fixed top-0 left-0 right-0 z-50 transition-[height,background-color,border-color,box-shadow] duration-500",
      showSearch ? "bg-[#1a1a1a] shadow-2xl h-screen lg:h-20" : (
        showMobileMenu ? "bg-background shadow-sm border-b border-foreground/10 h-16 lg:h-20" : "bg-primary/15 backdrop-blur-md border-b border-foreground/10 h-16 lg:h-20"
      )
    )}>
      <div className="container-custom h-16 lg:h-20 flex items-center justify-between">
        {!showSearch ? (
          <>
            {/* Logo */}
            <Link href={`/${locale}`} className="font-playfair font-bold text-2xl lg:text-3xl xl:text-4xl tracking-widest text-foreground hover:opacity-80 transition-opacity duration-300 z-[60]">
              ƯƠM<span className="text-primary">.</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link text-xs xl:text-sm ${
                    pathname === item.href ? 'underline underline-offset-8 decoration-primary decoration-2' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Categories Dropdown */}
              <div className="relative group flex items-center h-full">
                <button className="nav-link py-2 flex items-center gap-1 group-hover:opacity-70 transition-opacity text-xs xl:text-sm">
                  {locale === 'vi' ? 'DANH MỤC' : 'CATEGORIES'}
                </button>
                
                <div className="absolute top-full -left-4 w-56 bg-white border border-foreground/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[60] py-4 translate-y-2 group-hover:translate-y-0">
                  <nav className="flex flex-col">
                    {categories?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${locale}/shop?categoryId=${category.id}`}
                        className="px-6 py-3 text-[11px] uppercase tracking-widest text-foreground hover:bg-muted/30 hover:pl-8 transition-all duration-300 border-l-2 border-transparent hover:border-primary flex items-center gap-3"
                      >
                         {category.image && (
                            <div className="w-6 h-6 rounded-full overflow-hidden relative shrink-0">
                               <Image src={category.image} alt="" fill className="object-cover" />
                            </div>
                         )}
                         {locale === 'vi' ? category.nameVi : category.nameEn}
                      </Link>
                    ))}
                    <div className="mx-6 my-2 h-px bg-foreground/5" />
                    <Link
                      href={`/${locale}/shop`}
                      className="px-6 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all duration-300 italic"
                    >
                      {locale === 'vi' ? 'Xem tất cả' : 'View All'}
                    </Link>
                  </nav>
                </div>
              </div>

              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch(true)}
                className="nav-link p-1 hover:text-primary transition-colors flex items-center gap-2"
                aria-label="Search"
              >
                 <Search className="w-4 h-4" />
                 <span className="hidden xl:inline text-[10px] tracking-widest">SEARCH</span>
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
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <Search className="w-5 h-5 text-foreground" />
              </button>
              
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-foreground" />
                )}
              </button>
            </div>
          </>
        ) : (
          /* Header Search Mode - Active */
          <div className="flex items-center gap-4 lg:gap-8 w-full animate-in fade-in slide-in-from-top-4 duration-500">
             <p className="text-[10px] uppercase tracking-[0.4em] text-primary font-medium hidden lg:block shrink-0">
                {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
             </p>
             <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'vi' ? 'Nhập tên sản phẩm...' : 'Type to search...'}
                  className="w-full bg-transparent border-b border-white/10 py-2 text-lg lg:text-2xl font-playfair italic focus:outline-none transition-all duration-500 text-white placeholder:text-white/10"
                  autoFocus
                />
                {isSearching && searchQuery && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                  </div>
                )}
             </form>
             <button 
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="p-2 hover:opacity-50 transition-opacity"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer (Right Side) */}
      <div className={cn(
        "fixed inset-0 z-[49] lg:hidden pointer-events-none", // Reduced z-index to be below header
        showMobileMenu ? "pointer-events-auto" : ""
      )}>
         {/* Backdrop */}
         <div 
            className={cn(
               "absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500",
               showMobileMenu ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setShowMobileMenu(false)}
         />

         {/* Drawer Panel */}
         <div className={cn(
            "absolute top-16 right-0 h-[calc(100vh-4rem)] w-full md:w-[400px] bg-background shadow-2xl flex flex-col transition-transform duration-500 ease-out border-l border-white/10",
            showMobileMenu ? "translate-x-0" : "translate-x-full"
         )}>
             {/* Search in Menu */}
             <div className="shrink-0 px-6 py-2">
               <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(e);
                  setShowMobileMenu(false);
               }} className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={locale === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search for products...'}
                    className="w-full bg-muted/40 border border-transparent focus:border-primary/20 hover:bg-muted/60 rounded-xl px-10 py-3 text-sm focus:outline-none transition-all placeholder:text-muted-foreground/60"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-background shadow-sm opacity-0 group-focus-within:opacity-100 transition-all scale-90 group-focus-within:scale-100">
                    <span className="sr-only">Search</span>
                    <Search className="w-3 h-3" />
                  </button>
               </form>
             </div>
             
             {/* Menu Content */}
             <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide">
                {/* Main Links */}
                <nav className="flex flex-col space-y-1">
                   {navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "text-2xl font-playfair italic px-4 py-3 rounded-xl transition-all duration-300",
                          pathname === item.href 
                            ? "bg-primary/5 text-primary pl-6" 
                            : "text-foreground hover:bg-muted/50 hover:pl-6"
                        )}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        {item.name}
                      </Link>
                   ))}

                </nav>
                
                {/* Visual Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-foreground/10"></div>
                  <span className="relative z-10 bg-background px-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium ml-4">
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
                        className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/40 transition-all duration-300 group"
                      >
                         <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative shrink-0 shadow-sm group-hover:shadow-md transition-all">
                            {category.image ? (
                               <Image src={category.image} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-lg font-playfair italic text-muted-foreground/50 bg-muted">
                                  {category.nameEn.charAt(0)}
                               </div>
                            )}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-sm font-medium uppercase tracking-widest text-foreground/90 group-hover:text-primary transition-colors">
                             {locale === 'vi' ? category.nameVi : category.nameEn}
                           </span>
                           <span className="text-[10px] text-muted-foreground font-lora italic">
                             {locale === 'vi' ? 'Khám phá ngay' : 'Explore now'}
                           </span>
                         </div>
                         <div className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                           <div className="w-6 h-6 rounded-full border border-foreground/10 flex items-center justify-center">
                              <span className="text-[10px]">→</span>
                           </div>
                         </div>
                      </Link>
                   ))}
                </div>
             </div>
             
             {/* Drawer Footer */}
             <div className="shrink-0 p-6 border-t border-foreground/5 bg-muted/5">
                <Link 
                   href={newPath} 
                   className="flex items-center justify-between p-3 rounded-lg border border-foreground/5 bg-background/50 hover:bg-background hover:shadow-sm transition-all duration-300 group"
                   scroll={false}
                >
                   <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <span className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {locale.toUpperCase()}
                      </span>
                      {locale === 'vi' ? 'Đổi Ngôn ngữ' : 'Switch Language'}
                   </span>
                   <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
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
        <div className="absolute top-full left-0 w-full bg-[#1a1a1a] shadow-2xl border-t border-white/5 animate-in slide-in-from-top-2 duration-500 overflow-hidden max-h-[calc(100vh-80px)]">
          <div className="container-custom py-8 md:py-12 px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
              {/* Left Column: Products */}
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/30 border-b border-white/5 pb-4">
                  {locale === 'vi' ? 'Sản phẩm gợi ý' : 'Suggested Products'}
                </h3>
                
                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 scrollbar-hide">
                  {!searchQuery && (
                    <p className="text-[11px] italic text-white/20 font-lora">
                      {locale === 'vi' ? 'Gõ để bắt đầu tìm kiếm...' : 'Start typing to search...'}
                    </p>
                  )}
                  {searchQuery && suggestedProducts?.data.length === 0 && !isSearching && (
                    <p className="text-[11px] italic text-white/20 font-lora">
                      {locale === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'}
                    </p>
                  )}
                  {suggestedProducts?.data.map((product) => (
                    <Link
                      key={product.id}
                      href={`/${locale}/shop/${product.slug}`}
                      onClick={() => setShowSearch(false)}
                      className="group flex items-center gap-6 border-b border-white/5 pb-4 last:border-0 hover:border-primary/30 transition-all duration-500"
                    >
                      <div className="relative w-16 h-20 overflow-hidden bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-700 shrink-0">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.nameVi}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[11px] uppercase tracking-widest text-white/60 group-hover:text-primary transition-colors line-clamp-2">
                          {locale === 'vi' ? product.nameVi : product.nameEn}
                        </h4>
                        <p className="text-[10px] text-white/30 font-lora">
                          {formatPriceVND(product.priceVND)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Column: Categories */}
              <div className="space-y-6 md:space-y-8 hidden md:block">
                <h3 className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/30 border-b border-white/5 pb-4">
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
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/5 bg-white/5 grayscale group-hover:grayscale-0 transition-all duration-700 shrink-0">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.nameVi}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-100 transition-all"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 italic">
                            { (locale === 'vi' ? category.nameVi : category.nameEn).charAt(0) }
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] uppercase tracking-[0.2em] text-white/40 group-hover:text-primary transition-all duration-500">
                        {locale === 'vi' ? category.nameVi : category.nameEn}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 md:mt-12 pt-8 border-t border-white/5 flex justify-center">
               <button 
                  onClick={() => setShowSearch(false)}
                  className="text-[9px] uppercase tracking-[0.6em] text-white/20 hover:text-white/50 transition-colors"
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
