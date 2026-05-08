'use client'

import { usePathname } from 'next/navigation'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { Footer } from './Footer'
import { Header } from './Header'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  const isAdminPage = pathname.includes('/admin')

  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <SplashScreen />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
