'use client'

import { useEffect, useRef } from 'react'

interface ClientCacheBusterProps {
  currentVersion: string
}

export function ClientCacheBuster({ currentVersion }: ClientCacheBusterProps) {
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    const STORAGE_KEY = 'uom_ui_cache_version'
    const RELOAD_KEY = 'uom_last_cache_reload'

    try {
      const storedVersion = localStorage.getItem(STORAGE_KEY)

      if (storedVersion !== currentVersion) {
        // 1. Unregister all service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister().catch(() => {})
            }
          })
        }

        // 2. Clear CacheStorage
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key).catch(() => {})
            }
          })
        }

        // 3. Clear non-essential storage (Preserve login sessions!)
        try {
          sessionStorage.clear()
        } catch {}

        // 4. Update stored version
        localStorage.setItem(STORAGE_KEY, currentVersion)

        // 5. If returning user had an older version, perform single clean reload
        if (storedVersion && storedVersion !== 'null' && storedVersion !== 'undefined') {
          const now = Date.now()
          const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
          if (now - lastReload > 8000) {
            sessionStorage.setItem(RELOAD_KEY, String(now))
            window.location.reload()
          }
        }
      }
    } catch (err) {
      console.warn('[CacheBuster] Error checking version:', err)
    }

    // Expose manual purge utility on window for debugging or manual reset
    if (typeof window !== 'undefined') {
      ;(window as any).uomPurgeCacheAndReload = async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations()
            for (const reg of regs) await reg.unregister()
          }
          if ('caches' in window) {
            const keys = await caches.keys()
            for (const key of keys) await caches.delete(key)
          }
          localStorage.removeItem(STORAGE_KEY)
          sessionStorage.clear()
          window.location.reload()
        } catch {
          window.location.reload()
        }
      }
    }
  }, [currentVersion])

  return null
}
