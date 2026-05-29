'use client'

import { useEffect, useState } from 'react'
import { useBranding } from '@/hooks/use-settings'

const BRANDING_CACHE_KEY = 'uom_branding_cache'
const DEFAULT_LOADING_TEXT = 'ƯƠM.'
const DISPLAY_DURATION_MS = 1500

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
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(true)
  const [fontReady, setFontReady] = useState(false)
  const [cachedLoadingText, setCachedLoadingText] = useState<string | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    syncLoadingTextToCache(initialLoadingText)
    setCachedLoadingText(getCachedLoadingText())
  }, [initialLoadingText])

  useEffect(() => {
    if (!mounted) return

    const isBot = /googlebot|bingbot|yandexbot|baiduspider|slurp|duckduckbot/i.test(
      navigator.userAgent,
    )

    if (isBot) {
      setShow(false)
      return
    }

    const timer = setTimeout(() => {
      setShow(false)
    }, DISPLAY_DURATION_MS)

    return () => clearTimeout(timer)
  }, [mounted])

  // Prevent brief flash of fallback (thin) font by waiting for Playfair to load
  useEffect(() => {
    if (typeof document === 'undefined') {
      setFontReady(true)
      return
    }

    const fontName = 'Playfair Display'
    let cancelled = false

    // If Font Loading API is available, try to load the font, otherwise proceed.
    if (document.fonts && typeof document.fonts.load === 'function') {
      // Use a short timeout to avoid blocking too long on slow networks.
      const timeout = window.setTimeout(() => {
        if (!cancelled) setFontReady(true)
      }, 700)

      document.fonts
        .load(`1em "${fontName}"`)
        .then(() => {
          if (!cancelled) {
            setFontReady(true)
            clearTimeout(timeout)
          }
        })
        .catch(() => {
          if (!cancelled) setFontReady(true)
        })

      return () => {
        cancelled = true
      }
    }

    // Fallback: assume font is ready
    setFontReady(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setCachedLoadingText(getCachedLoadingText())
    }
  }, [branding?.loadingText, mounted])

  const displayText =
    initialLoadingText || branding?.loadingText || cachedLoadingText || DEFAULT_LOADING_TEXT
  const normalizedDisplayText = (displayText || '').trim()

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-300 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!show}
    >
      <div className="relative mx-auto w-full max-w-[90vw] px-4 text-center">
        {normalizedDisplayText && fontReady && (
          <h1
            className="animate-pulse break-words font-playfair text-[clamp(2rem,12vw,5rem)] font-bold leading-[0.95] tracking-[0.08em] text-foreground [overflow-wrap:anywhere] md:tracking-[0.12em]"
            style={{
              animation: 'fadeIn 220ms ease-out, pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
