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
  Image as ImageIcon,
  Brush,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { User } from '@/lib/types'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayoutClient({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('admin')
  const { user, setUser, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const switchLocale = locale === 'vi' ? 'en' : 'vi'
  const newPath = pathname.replace(`/${locale}`, `/${switchLocale}`)

  const isLoginPage = pathname.includes('/admin/login')

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoginPage) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await api.getMe()
        setUser(userData)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push(`/${locale}/admin/login`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [isLoginPage, locale, router, setUser])

  const handleLogout = async () => {
    await api.logout()
    logout()
    router.push(`/${locale}/admin/login`)
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  const navItems = [
    { href: `/${locale}/admin/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/admin/products`, label: t('products'), icon: Package },
    { href: `/${locale}/admin/banners`, label: 'Banners', icon: ImageIcon },
    { href: `/${locale}/admin/categories`, label: t('categories'), icon: LayoutGrid },
    { href: `/${locale}/admin/branding`, label: t('branding.navLabel'), icon: Brush },
    { href: `/${locale}/admin/about`, label: t('aboutPage'), icon: FileText },
    { href: `/${locale}/admin/settings`, label: t('settings'), icon: Settings },
  ]

  if (user?.role === 'ADMIN') {
    navItems.push({ href: `/${locale}/admin/users`, label: t('users'), icon: Users })
  }

  return (
    <div className="flex min-h-screen bg-background pt-16 text-foreground md:pt-0">
      {/* Mobile Top Bar */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Logo variant="text" customHref={`/${locale}/admin/dashboard`} />
        </div>
        <Link
          href={newPath}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {switchLocale}
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo with Dashboard text */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Logo variant="text" customHref={`/${locale}/admin/dashboard`} />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t('dashboard')}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={newPath}
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {switchLocale}
              </Link>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* User info and logout */}
          <div className="p-4">
            {user && (
              <div className="mb-4">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            )}
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
