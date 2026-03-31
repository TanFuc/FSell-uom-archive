'use client'

import { useEffect, useState } from 'react'
import { useBranding } from '@/hooks/use-settings'

export function SplashScreen() {
  const { data: branding } = useBranding()
  const [show, setShow] = useState(true)

  const BRANDING_CACHE_KEY = 'uom_branding_cache'

  const getCachedLoadingText = () => {
    if (typeof window === 'undefined') return undefined
    try {
      const stored = localStorage.getItem(BRANDING_CACHE_KEY)
      if (!stored) return undefined
      const parsed = JSON.parse(stored) as { loadingText?: string }
      return parsed.loadingText
    } catch {
      return undefined
    }
  }

  const [cachedLoadingText, setCachedLoadingText] = useState<string | undefined>(() =>
    getCachedLoadingText(),
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setCachedLoadingText(getCachedLoadingText())
  }, [branding?.loadingText])

  const displayText = branding?.loadingText || cachedLoadingText || ''

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!show}
    >
      <div className="relative">
        <h1
          className="animate-pulse font-playfair text-6xl font-bold tracking-widest text-foreground md:text-8xl"
          suppressHydrationWarning
        >
          {displayText}
        </h1>
      </div>
    </div>
  )
}
