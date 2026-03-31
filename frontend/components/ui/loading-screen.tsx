'use client'

import { useMemo } from 'react'
import { useBranding } from '@/hooks/use-settings'

interface LoadingScreenProps {
  text?: string
}

export function LoadingScreen({ text }: LoadingScreenProps) {
  const { data: branding } = useBranding()
  const displayText = useMemo(
    () => text ?? branding?.loadingText ?? '',
    [text, branding?.loadingText],
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
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
