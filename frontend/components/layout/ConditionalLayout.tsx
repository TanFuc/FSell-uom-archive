'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'
import { Header } from './Header'
import { SplashScreen } from '@/components/ui/SplashScreen'

interface ConditionalLayoutProps {
  children: React.ReactNode
  initialLoadingText?: string
}

export function ConditionalLayout({ children, initialLoadingText }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Check if current path is an admin page
  const isAdminPage = pathname.includes('/admin')

  // Admin pages have their own layout with sidebar, no header/footer needed
  if (isAdminPage) {
    return <>{children}</>
  }

  // Regular pages get header, footer, and splash screen
  return (
    <>
      <SplashScreen initialLoadingText={initialLoadingText} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
