'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ConfirmOptions {
  title?: string
  description: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
  icon?: 'trash' | 'warning' | 'info'
}

export type ConfirmFunction = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmationContext = createContext<ConfirmFunction | null>(null)

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    description: '',
  })
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm: ConfirmFunction = useCallback((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      if (typeof opts === 'string') {
        setOptions({
          title: 'Xác nhận hành động',
          description: opts,
          confirmText: 'Xác nhận',
          cancelText: 'Hủy',
          variant: 'default',
          icon: 'warning',
        })
      } else {
        setOptions({
          title: opts.title || 'Xác nhận hành động',
          description: opts.description,
          confirmText: opts.confirmText || 'Xác nhận',
          cancelText: opts.cancelText || 'Hủy',
          variant: opts.variant || 'destructive',
          icon: opts.icon || (opts.variant === 'destructive' ? 'trash' : 'warning'),
        })
      }
      setOpen(true)
    })
  }, [])

  const handleCancel = () => {
    setOpen(false)
    if (resolverRef.current) {
      resolverRef.current(false)
      resolverRef.current = null
    }
  }

  const handleConfirm = () => {
    setOpen(false)
    if (resolverRef.current) {
      resolverRef.current(true)
      resolverRef.current = null
    }
  }

  // Intercept native browser alert to prevent browser native dialogs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert
      window.alert = (message?: any) => {
        toast.info(String(message ?? ''))
      }
      return () => {
        window.alert = originalAlert
      }
    }
  }, [])

  const isDestructive = options.variant === 'destructive'

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel()
        }}
      >
        <DialogContent className="rounded-2xl border border-border/70 bg-background p-6 shadow-2xl sm:max-w-[420px]">
          <DialogHeader className="flex flex-col items-center gap-3 text-center">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                isDestructive
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
              )}
            >
              {options.icon === 'trash' ? (
                <Trash2 className="h-6 w-6" />
              ) : options.icon === 'info' ? (
                <Info className="h-6 w-6 text-blue-600" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {options.title}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                {options.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2.5 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-9 flex-1 text-xs"
            >
              {options.cancelText}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isDestructive ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className="h-9 flex-1 text-xs"
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmationContext.Provider>
  )
}

export function useConfirm(): ConfirmFunction {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider')
  }
  return context
}
