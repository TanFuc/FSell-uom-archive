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

  const isAdminPage = pathname.includes('/admin')

  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <SplashScreen initialLoadingText={initialLoadingText} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
