'use client'

import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Brush,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  KeyRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AccountModal } from '@/components/admin/AccountModal'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayoutClient({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { user, setUser, logout } = useAuthStore()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile drawer state
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop collapse state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  const isLoginPage = pathname.includes('/admin/login')
  const [isAuthorized, setIsAuthorized] = useState(isLoginPage || !!user)

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const newPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  // Initialize desktop collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed')
      if (savedCollapsed === 'true') {
        setIsCollapsed(true)
      }
    }
  }, [])

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_sidebar_collapsed', String(next))
      }
      return next
    })
  }

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const activeTag = document.activeElement?.tagName?.toLowerCase()
        if (
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          document.activeElement?.getAttribute('contenteditable') === 'true'
        ) {
          return
        }
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthorized(true)
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      setIsAuthorized(false)
      router.replace(`/${locale}/admin/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    let isMounted = true
    const checkAuth = async () => {
      try {
        const userData = await api.getMe()
        if (isMounted) {
          setUser(userData)
          setIsAuthorized(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          setIsAuthorized(false)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          if (typeof document !== 'undefined') {
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
          router.replace(`/${locale}/admin/login?redirect=${encodeURIComponent(pathname)}`)
        }
      }
    }

    if (!user) {
      checkAuth()
    } else {
      setIsAuthorized(true)
    }

    return () => {
      isMounted = false
    }
  }, [isLoginPage, locale, pathname, router, setUser, user])

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {}
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    logout()
    setIsAuthorized(false)
    router.replace(`/${locale}/admin/login`)
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!isAuthorized || !user) {
    return <LoadingScreen />
  }

  const navItems = [
    { href: `/${locale}/admin/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/admin/products`, label: t('products'), icon: Package },
    { href: `/${locale}/admin/banners`, label: 'Banners', icon: ImageIcon },
    { href: `/${locale}/admin/categories`, label: t('categories'), icon: LayoutGrid },
    { href: `/${locale}/admin/branding`, label: t('branding.navLabel'), icon: Brush },
    { href: `/${locale}/admin/stories`, label: t('stories.navLabel'), icon: BookOpen },
    { href: `/${locale}/admin/trending`, label: t('trending.navLabel'), icon: Sparkles },
    { href: `/${locale}/admin/about`, label: t('aboutPage'), icon: FileText },
    { href: `/${locale}/admin/settings`, label: t('settings'), icon: Settings },
  ]

  if (user?.role === 'ADMIN') {
    navItems.push({ href: `/${locale}/admin/users`, label: t('users'), icon: Users })
  }

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Mobile Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Logo variant="text" customHref={`/${locale}/admin/dashboard`} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            className="h-8 px-2 text-xs"
          >
            <UserIcon className="mr-1 h-4 w-4" />
            {user.fullName.split(' ')[0]}
          </Button>
          <Link
            href={newPath}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {switchLocale}
          </Link>
        </div>
      </div>

      {/* Sidebar: Desktop is in-flow relative flex child; Mobile is slide-in drawer */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300 ease-in-out',
          // Mobile drawer (fixed overlay)
          'fixed inset-y-0 left-0 z-40 w-72',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop behavior (in-flow relative flex child, never overlaps content)
          'md:relative md:inset-auto md:z-auto md:flex md:h-full md:flex-shrink-0 md:translate-x-0',
          isCollapsed ? 'md:w-20' : 'md:w-64',
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            'relative flex h-16 flex-shrink-0 items-center border-b transition-all duration-300',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {/* Expanded Branding: Full Logo + ADMIN tag */}
          {!isCollapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Logo variant="text" customHref={`/${locale}/admin/dashboard`} />
              <span className="rounded border border-neutral-200/60 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                ADMIN
              </span>
            </div>
          ) : (
            /* Collapsed Branding: Centered "Ư." mark in perfect alignment with nav icons below */
            <Link
              href={`/${locale}/admin/dashboard`}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-bold text-neutral-900 transition-all hover:bg-neutral-100 hover:text-neutral-700"
              title="ƯƠM. Archive - Bảng điều khiển"
            >
              <span>Ư.</span>
              <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 font-sans text-xs font-medium text-white shadow-xl group-hover:md:block">
                ƯƠM. Archive • Bảng điều khiển
              </span>
            </Link>
          )}

          {/* Expanded Actions: Language switcher + Collapse Button + Mobile Close */}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Link
                href={newPath}
                className="rounded px-1.5 py-1 text-xs font-semibold uppercase tracking-widest text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                title={`Đổi ngôn ngữ sang ${switchLocale.toUpperCase()}`}
              >
                {switchLocale}
              </Link>

              {/* Desktop Collapse Button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 md:flex"
                onClick={toggleCollapsed}
                title="Thu gọn sidebar (Ctrl+B)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-500 hover:text-neutral-900 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Collapsed Rail Expand Button: Centered vertically on the right border dividing line */}
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="shadow-xs absolute -right-3 top-1/2 z-50 hidden h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all hover:scale-110 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 md:flex"
              title="Mở rộng sidebar (Ctrl+B)"
              aria-label="Mở rộng sidebar"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'shadow-xs bg-neutral-100 font-semibold text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900',
                  isCollapsed && 'md:mx-auto md:h-10 md:w-10 md:justify-center md:px-0',
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-900',
                  )}
                />
                <span className={cn('truncate text-[13px]', isCollapsed && 'md:hidden')}>
                  {item.label}
                </span>

                {/* Collapsed hover tooltip */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:md:block">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* User Account & Logout Footer - Clean Light Aesthetic, No Dark Box */}
        <div className="flex-shrink-0 border-t border-neutral-200/70 bg-neutral-50/50 p-3">
          {!isCollapsed ? (
            <div className="space-y-2">
              {/* User Profile Card */}
              <div
                onClick={() => setIsAccountModalOpen(true)}
                className="shadow-2xs group flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white p-2.5 transition-all hover:border-neutral-300 hover:bg-neutral-50"
                title="Bấm để cập nhật thông tin và đổi mật khẩu"
              >
                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 font-serif text-xs font-bold text-white">
                  {userInitial}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-neutral-900 transition-colors group-hover:text-neutral-700">
                      {user.fullName || 'Admin User'}
                    </p>
                    <span className="rounded border border-neutral-200/60 bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-neutral-600">
                      {user.role}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
                </div>
                <KeyRound className="h-3.5 w-3.5 text-neutral-400 transition-colors group-hover:text-neutral-700" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 justify-center rounded-lg border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  onClick={() => setIsAccountModalOpen(true)}
                >
                  <UserIcon className="mr-1.5 h-3.5 w-3.5 text-neutral-500" />
                  Tài khoản
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg px-2.5 text-xs text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={handleLogout}
                  title={t('logout')}
                >
                  <LogOut className="mr-1 h-3.5 w-3.5" />
                  {t('logout')}
                </Button>
              </div>
            </div>
          ) : (
            /* Collapsed Mode */
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="shadow-xs group relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 font-serif text-xs font-bold text-white transition-all hover:ring-2 hover:ring-neutral-400"
                title={`${user.fullName} (${t('accountManagement')})`}
              >
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:md:block">
                  {user.fullName} • Quản lý tài khoản
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="h-7.5 w-7.5 group relative flex items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
                title={t('logout')}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:md:block">
                  {t('logout')}
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area - Scrollable Independently */}
      <main className="h-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        <div className="mx-auto min-w-0 max-w-7xl p-4 sm:p-6 md:p-8">{children}</div>
      </main>

      {/* Account Management Modal (Accessible from anywhere) */}
      <AccountModal open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen} />
    </div>
  )
}
