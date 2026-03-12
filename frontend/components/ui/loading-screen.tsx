'use client'

import { useState, useEffect } from 'react'
import { useBranding } from '@/hooks/use-settings'

const DEFAULT_LOADING_TEXT = 'ƯƠM.'

interface LoadingScreenProps {
  text?: string
}

export function LoadingScreen({ text }: LoadingScreenProps) {
  const { data: branding } = useBranding()
  const [displayText, setDisplayText] = useState(text ?? DEFAULT_LOADING_TEXT)

  useEffect(() => {
    if (text) {
      setDisplayText(text)
    } else if (branding?.loadingText) {
      setDisplayText(branding.loadingText)
    }
  }, [text, branding?.loadingText])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="relative">
        <h1 className="animate-pulse font-playfair text-6xl font-bold tracking-widest text-foreground md:text-8xl">
          {displayText}
        </h1>
      </div>
    </div>
  )
}

