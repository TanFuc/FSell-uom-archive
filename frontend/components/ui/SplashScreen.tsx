'use client'

import { useEffect, useState } from 'react'
import { useBranding } from '@/hooks/use-settings'

const BRANDING_CACHE_KEY = 'uom_branding_cache'
const DEFAULT_LOADING_TEXT = ''

function getCachedLoadingText() {
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

function syncLoadingTextToCache(initialLoadingText?: string) {
  if (typeof window === 'undefined') return

  const normalized = initialLoadingText?.trim()
  if (!normalized) return

  try {
    const stored = localStorage.getItem(BRANDING_CACHE_KEY)
    const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {}
    localStorage.setItem(
      BRANDING_CACHE_KEY,
      JSON.stringify({
        ...parsed,
        loadingText: normalized,
      }),
    )
  } catch {}
}

export function SplashScreen({ initialLoadingText }: { initialLoadingText?: string }) {
  const { data: branding } = useBranding()
  const [show, setShow] = useState(true)

  const [cachedLoadingText, setCachedLoadingText] = useState<string | undefined>(() =>
    getCachedLoadingText(),
  )

  useEffect(() => {
    syncLoadingTextToCache(initialLoadingText)
    setCachedLoadingText(getCachedLoadingText())
  }, [initialLoadingText])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setCachedLoadingText(getCachedLoadingText())
  }, [branding?.loadingText])

  const displayText =
    initialLoadingText || branding?.loadingText || cachedLoadingText || DEFAULT_LOADING_TEXT
  const normalizedDisplayText = displayText.trim()

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!show}
    >
      <div className="relative mx-auto w-full max-w-[90vw] px-4 text-center">
        {normalizedDisplayText && (
          <h1
            className="animate-pulse break-words font-playfair text-[clamp(2rem,12vw,5rem)] font-bold leading-[0.95] tracking-[0.08em] text-foreground [overflow-wrap:anywhere] md:tracking-[0.12em]"
            style={{
              animation: 'fadeIn 180ms ease-out, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
            suppressHydrationWarning
          >
            {normalizedDisplayText}
          </h1>
        )}
      </div>
    </div>
  )
}
