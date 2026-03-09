'use client'

import { useBranding } from '@/hooks/use-settings'

interface LoadingScreenProps {
  text?: string
}

export function LoadingScreen({ text }: LoadingScreenProps) {
  const { data: branding } = useBranding()
  const displayText = text ?? branding?.loadingText ?? 'ƯƠM.'

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

