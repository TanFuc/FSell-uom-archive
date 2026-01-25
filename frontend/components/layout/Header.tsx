'use client'

import { Search, X, Loader2, Menu, Instagram, Facebook } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useLayoutEffect, memo } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { useProducts } from '@/hooks/use-products'
import { useSocialLinks } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'
import { getDisplayPrice } from '@/lib/currency'
import { motion, AnimatePresence } from 'framer-motion'

// Optimized Result Item
const SearchResultItem = memo(({ product, locale, onClick }: any) => (
  <div className="group space-y-3 flex flex-col items-center text-center">
    <Link 
      href={`/${locale}/shop/${product.slug}`} 
      onClick={onClick} 
      className="relative aspect-square w-24 md:w-28 overflow-hidden rounded-full bg-muted/5 border border-foreground/[0.03] block"
    >
      {product.images?.[0] && (
        <Image 
          src={product.images[0]} 
          alt="" 
          fill 
          sizes="(max-width: 768px) 96px, 112px"
          className="object-cover" 
        />
      )}
    </Link>
    <div className="space-y-0.5 max-w-[100px]">
      <p className="text-[8px] font-bold uppercase tracking-widest line-clamp-1">{locale === 'vi' ? product.nameVi : product.nameEn}</p>
      <p className="text-[7.5px] font-medium text-foreground/30 uppercase">{getDisplayPrice(product, locale).currentPrice}</p>
    </div>
  </div>
))
SearchResultItem.displayName = 'SearchResultItem'

export function Header() {
  const pathname = usePathname()
  const locale = useLocale() as 'vi' | 'en'
  const router = useRouter()
  const t = useTranslations('Navigation')
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: categories } = useCategories({ includeInactive: false })

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

  const { data: suggestedProducts, isLoading: isSearching } = useProducts({
    search: debouncedQuery,
    limit: 4,
    isActive: true,
  })

  const navigation = [
    { name: t('shop'), href: `/${locale}/shop` },
    { name: 'ABOUT US', href: `/${locale}/about` },
    { name: 'JOURNAL', href: `/${locale}/journal` },
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
    <header className={cn(
      'fixed left-0 right-0 top-0 z-50 transition-all duration-500',
      isHeaderOpaque ? 'bg-white shadow-sm' : 'bg-transparent'
    )}>
      <div className={cn(
        "relative z-[70] flex items-center px-6 lg:px-12 bg-inherit transition-all duration-500",
        isScrolled ? "h-16 lg:h-20" : "h-20 lg:h-28",
        isHeaderOpaque && !isScrolled ? "border-b border-foreground/[0.03]" : "border-b-0"
      )}>
        <div className="flex w-full items-center justify-between">
            {/* Left */}
            <div className="flex w-1/3 items-center">
              <button 
                onClick={() => { setShowMobileMenu(!showMobileMenu); setShowSearch(false) }}
                className="group flex items-center gap-2 py-2 outline-none"
              >
                <div className="flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {showMobileMenu ? (
                      <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <X className={cn("transition-all duration-500", isScrolled ? "h-5 w-5 lg:h-6 lg:w-6" : "h-6 w-6 lg:h-8 lg:w-8")} />
                      </motion.div>
                    ) : (
                      <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Menu className={cn("transition-all duration-500", isScrolled ? "h-5 w-5 lg:h-6 lg:w-6" : "h-6 w-6 lg:h-8 lg:w-8")} />
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
                  "font-playfair font-black tracking-tighter transition-all duration-500",
                  "text-4xl lg:text-6xl",
                  isScrolled ? "opacity-0 -translate-y-8 pointer-events-none scale-90 blur-sm" : "opacity-100 translate-y-0 hover:opacity-80"
                )}
                tabIndex={isScrolled ? -1 : 0}
              >
                ƯƠM.
              </Link>
            </div>

            {/* Right Socials + Search + Lang */}
            <div className="flex w-1/3 items-center justify-end gap-3 lg:gap-8">
              {/* Desktop Socials */}
              <div className="hidden lg:flex items-center gap-5 mr-2">
                {socialLinks?.instagramUsername && (
                  <a href={`https://instagram.com/${socialLinks.instagramUsername}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks?.facebookPageUrl && (
                  <a href={socialLinks.facebookPageUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>

              <button 
                onClick={() => { setShowSearch(!showSearch); setShowMobileMenu(false) }} 
                className="flex items-center gap-2 py-1 outline-none"
              >
                {showSearch ? <X className="h-5 w-5 lg:h-6 lg:w-6" /> : <Search className="h-5 w-5 lg:h-6 lg:w-6" />}
                <span className="hidden text-xs font-bold tracking-widest lg:inline uppercase leading-none">
                  {showSearch ? 'CLOSE' : 'SEARCH'}
                </span>
              </button>
              
              <Link 
                href={newPath} 
                className="flex h-full items-center text-xs lg:text-sm font-bold tracking-widest uppercase leading-none"
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
              onAnimationComplete={() => setIsPanelReady(true)}
              transition={{ duration: 0.5, ease: cubicBezier }}
              className="absolute left-0 right-0 top-0 bg-[#fbfbfb] pt-16 lg:pt-20 shadow-2xl will-change-transform"
            >
              <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-[1100px] mx-auto w-full min-h-[300px]">
                <motion.div animate={isPanelReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }} transition={{ duration: 0.3 }}>
                  <form onSubmit={handleSearch} className="relative mb-10">
                    <input
                      type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={locale === 'vi' ? 'Tìm kiếm...' : 'Search...'}
                      className="w-full bg-transparent border-b border-foreground/10 py-3 font-sans text-xl lg:text-2xl font-bold uppercase tracking-tight focus:outline-none focus:border-primary/30"
                      autoFocus
                    />
                    {isSearching && searchQuery && <div className="absolute right-0 top-1/2 -translate-y-1/2"><Loader2 className="h-5 w-5 animate-spin opacity-20" /></div>}
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                     <div className="md:col-span-3">
                        <h4 className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/30 mb-6">SUGGESTED</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 justify-items-center">
                          {suggestedProducts?.data.map((product) => (
                            <SearchResultItem key={product.id} product={product} locale={locale} onClick={() => setShowSearch(false)} />
                          ))}
                        </div>
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/30 mb-6">CATEGORIES</h4>
                        <nav className="flex flex-col gap-3">
                          {categories?.map((cat) => (
                            <Link key={cat.id} href={`/${locale}/shop?categoryId=${cat.id}`} onClick={() => setShowSearch(false)} className="text-[10px] font-bold uppercase tracking-widest hover:pl-2 transition-all">
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              onAnimationComplete={() => setIsPanelReady(true)}
              transition={{ duration: 0.5, ease: cubicBezier }}
              className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[380px] bg-white shadow-2xl flex flex-col pt-16 lg:pt-20 will-change-transform"
            >
              <div className="flex-1 px-8 lg:px-12 py-12 flex flex-col justify-between">
                <motion.nav animate={isPanelReady ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }} className="flex flex-col space-y-6">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className="text-3xl font-bold uppercase tracking-tighter hover:text-primary transition-all">
                      {item.name}
                    </Link>
                  ))}
                </motion.nav>
                <motion.div animate={isPanelReady ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.1 }} className="space-y-8">
                  <div className="flex gap-6 text-foreground/40">
                    {socialLinks?.instagramUsername && <a href={`https://instagram.com/${socialLinks.instagramUsername}`} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 hover:text-foreground transition-colors" /></a>}
                    {socialLinks?.facebookPageUrl && <a href={socialLinks.facebookPageUrl} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 hover:text-foreground transition-colors" /></a>}
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-foreground/20">Saigon / Vietnam</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
