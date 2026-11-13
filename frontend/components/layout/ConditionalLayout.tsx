'use client'

import { usePathname } from 'next/navigation'
import { SplashScreen } from '@/components/ui/SplashScreen'
import type { SiteContent } from '@/lib/types'
import { Footer } from './Footer'
import { Header } from './Header'

interface ConditionalLayoutProps {
  children: React.ReactNode
  initialSiteContent?: SiteContent
}

export function ConditionalLayout({ children, initialSiteContent }: ConditionalLayoutProps) {
  const pathname = usePathname()

  const isAdminPage = pathname.includes('/admin')

  if (isAdminPage) {
    return <div className="font-admin font-normal">{children}</div>
  }

  return (
    <>
      <SplashScreen />
      <Header initialSiteContent={initialSiteContent} />
      <main className="flex-1">{children}</main>
      <Footer initialSiteContent={initialSiteContent} />
    </>
  )
}
