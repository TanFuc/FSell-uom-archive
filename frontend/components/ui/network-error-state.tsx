'use client'

import { ArrowLeft, Check, RefreshCw, Signal, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface NetworkErrorStateProps {
  className?: string
  compact?: boolean
  isRetrying?: boolean
  onRetry?: () => void | Promise<unknown>
}

export function NetworkErrorState({
  className,
  compact = false,
  isRetrying = false,
  onRetry,
}: NetworkErrorStateProps) {
  const locale = useLocale()
  const t = useTranslations('networkError')
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isLocallyRetrying, setIsLocallyRetrying] = useState(false)

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)

    updateConnection()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)

    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  const handleRetry = useCallback(async () => {
    if (!onRetry) {
      window.location.reload()
      return
    }

    setIsLocallyRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsLocallyRetrying(false)
    }
  }, [onRetry])

  const offline = isOnline === false
  const retrying = isRetrying || isLocallyRetrying

  return (
    <section
      className={cn(
        'relative isolate flex w-full items-center overflow-hidden bg-background',
        compact ? 'min-h-[64vh] py-16 sm:py-20' : 'min-h-[calc(100svh-5rem)] py-20 sm:py-24',
        className,
      )}
      aria-labelledby="network-error-title"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full border border-foreground/10 sm:h-[28rem] sm:w-[28rem] lg:right-[8%] lg:top-1/2 lg:-translate-y-1/2"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-8 top-28 h-44 w-44 rounded-full border border-foreground/10 sm:h-72 sm:w-72 lg:right-[13%] lg:top-1/2 lg:-translate-y-1/2"
        aria-hidden="true"
      />

      <div className="container-custom relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.75fr)] lg:gap-20">
          <div className="animate-fade-in max-w-2xl">
            <div className="mb-8 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground sm:text-xs">
              <span className="h-px w-8 bg-foreground sm:w-12" />
              {offline ? t('offlineLabel') : t('serviceLabel')}
            </div>

            <h1
              id="network-error-title"
              className="text-mobile-safe font-playfair text-[clamp(2.65rem,8vw,6.75rem)] font-normal leading-[0.92] tracking-[-0.04em]"
            >
              {offline ? t('offlineTitle') : t('serviceTitle')}
            </h1>

            <p className="mt-7 max-w-xl text-sm font-normal leading-7 tracking-[0.02em] text-muted-foreground sm:mt-9 sm:text-base sm:leading-8">
              {offline ? t('offlineDescription') : t('serviceDescription')}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void handleRetry()}
                disabled={retrying}
                className="group inline-flex min-h-12 items-center justify-center gap-3 border border-foreground bg-foreground px-6 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-wait disabled:opacity-60 sm:px-8"
              >
                <RefreshCw
                  className={cn('h-4 w-4', retrying && 'animate-spin')}
                  aria-hidden="true"
                />
                {retrying ? t('retrying') : t('retry')}
              </button>
              <Link
                href={`/${locale}`}
                className="group inline-flex min-h-12 items-center justify-center gap-3 border border-foreground/30 px-6 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:border-foreground sm:px-8"
              >
                <ArrowLeft
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  aria-hidden="true"
                />
                {t('backHome')}
              </Link>
            </div>

            <p className="mt-7 flex items-start gap-2 text-xs font-normal leading-5 tracking-normal text-muted-foreground">
              <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
              {t('hint')}
            </p>
          </div>

          <div
            className="relative mx-auto hidden aspect-square w-full max-w-md place-items-center lg:grid"
            aria-hidden="true"
          >
            <div className="absolute inset-[8%] rounded-full border border-foreground/10" />
            <div className="absolute inset-[23%] rounded-full border border-foreground/15" />
            <div className="absolute inset-[38%] rounded-full border border-foreground/20" />

            <div className="relative grid h-28 w-28 place-items-center rounded-full border border-foreground bg-background shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
              {offline ? <WifiOff className="h-9 w-9" /> : <Signal className="h-9 w-9" />}
            </div>

            <span className="absolute left-[8%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-foreground" />
            <span className="absolute right-[18%] top-[20%] h-2 w-2 rounded-full border border-foreground bg-background" />
            <span className="absolute bottom-[17%] right-[25%] h-3 w-3 rounded-full bg-foreground" />

            <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border border-foreground/15 bg-background px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]">
              {offline ? <WifiOff className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {offline ? t('offlineStatus') : t('checkingStatus')}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
