import { useEffect, useState } from 'react'

/**
 * Custom "Ươm." Loading Screen Component
 * 
 * Features:
 * - Fullscreen overlay (NOT a small spinner)
 * - Character-by-character pulse animation
 * - Vietnamese accent marks (Ư, ơ) preserved
 * - Smooth fade transitions
 * - Optional loading bar
 * 
 * Usage:
 * ```tsx
 * import { UomLoader } from '@/components/loading/UomLoader'
 * 
 * <UomLoader isLoading={isLoading} />
 * ```
 */

interface UomLoaderProps {
  isLoading: boolean
  showLoadingBar?: boolean
}

export function UomLoader({ 
  isLoading, 
  showLoadingBar = true 
}: UomLoaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent SSR hydration mismatch
  if (!mounted) return null
  
  // Don't render if not loading
  if (!isLoading) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Animated "Ươm." text with Vietnamese accents */}
        <div className="relative">
          <h1 className="text-8xl font-serif tracking-wide text-foreground select-none antialiased">
            <span className="inline-block animate-pulse-char animation-delay-0">
              Ư
            </span>
            <span className="inline-block animate-pulse-char animation-delay-100">
              ơ
            </span>
            <span className="inline-block animate-pulse-char animation-delay-200">
              m
            </span>
            <span className="inline-block animate-pulse-char animation-delay-300">
              .
            </span>
          </h1>
        </div>

        {/* Optional: Subtle loading bar */}
        {showLoadingBar && (
          <div className="w-64 h-0.5 bg-muted overflow-hidden">
            <div className="h-full bg-foreground animate-loading-bar" />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Alternative variation: Breathing effect
 * Gentler animation for slower connections
 */
export function UomLoaderBreathing({ isLoading }: { isLoading: boolean }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <h1 className="text-8xl font-serif tracking-wide text-foreground select-none animate-breathe">
          Ươm.
        </h1>
      </div>
    </div>
  )
}

/**
 * Alternative variation: Typewriter effect
 * Characters appear one by one
 */
export function UomLoaderTypewriter({ isLoading }: { isLoading: boolean }) {
  const [mounted, setMounted] = useState(false)
  const characters = ['Ư', 'ơ', 'm', '.']

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <h1 className="text-8xl font-serif tracking-wide text-foreground select-none">
          {characters.map((char, i) => (
            <span
              key={i}
              className="inline-block animate-fade-in"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationFillMode: 'backwards',
              }}
            >
              {char}
            </span>
          ))}
        </h1>
      </div>
    </div>
  )
}
