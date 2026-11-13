'use client'

import { NetworkErrorState } from '@/components/ui/network-error-state'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <NetworkErrorState
      compact
      onRetry={reset}
      className="before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-border"
      key={error.digest ?? error.message}
    />
  )
}
