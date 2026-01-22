'use client'

import { AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorToastContentProps {
  title: string
  message: string
  statusCode?: number
  path?: string
  method?: string
  timestamp?: string
  className?: string
}

export function ErrorToastContent({
  title,
  message,
  className,
}: Omit<ErrorToastContentProps, 'path' | 'method' | 'timestamp' | 'statusCode'>) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-[#E8D4C5]" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-[#FCFAF7] tracking-wide">{title}</h3>
        <p className="text-sm text-[#E8D4C5] leading-relaxed font-light mt-0.5">{message}</p>
      </div>
    </div>
  )
}

interface SuccessToastContentProps {
  title: string
  message: string
  className?: string
}

export function SuccessToastContent({
  title,
  message,
  className,
}: SuccessToastContentProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-green-50">{title}</h3>
        <p className="text-sm text-green-100 mt-1">{message}</p>
      </div>
    </div>
  )
}
