'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import { SplashScreen } from '@/components/ui/SplashScreen'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
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
      <SplashScreen />
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
    </>
  )
}
