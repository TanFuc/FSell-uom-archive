'use client'

import { useMemo } from 'react'
import { useBranding } from '@/hooks/use-settings'

interface LoadingScreenProps {
  text?: string
  fullscreen?: boolean
}

const DEFAULT_LOADING_TEXT = 'ƯƠM.'

function normalizeLoadingText(value?: string) {
  const normalized = value?.trim()
  if (!normalized) return ''
  if (normalized.length > 24 || normalized.split(/\s+/).length > 3) return DEFAULT_LOADING_TEXT
  return normalized
}

export function LoadingScreen({ text, fullscreen = false }: LoadingScreenProps) {
  const { data: branding } = useBranding()
  const displayText = useMemo(
    () => text ?? branding?.loadingText ?? DEFAULT_LOADING_TEXT,
    [text, branding?.loadingText],
  )
  const normalizedDisplayText = normalizeLoadingText(displayText)

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[120] flex items-center justify-center bg-background'
          : 'flex min-h-screen items-center justify-center bg-background'
      }
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
