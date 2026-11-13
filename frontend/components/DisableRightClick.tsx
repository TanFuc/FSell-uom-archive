'use client'

import { useEffect } from 'react'

export function DisableRightClick() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu)

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
          localStorage.removeItem('uom_ui_cache_version')
          sessionStorage.clear()
          window.location.reload()
        } catch {
          window.location.reload()
        }
      }
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return null
}
