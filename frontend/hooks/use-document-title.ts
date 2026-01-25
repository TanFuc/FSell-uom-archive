'use client'

import { useEffect } from 'react'

/**
 * Custom hook to update document title dynamically
 * @param title - The title to set for the page
 * @param suffix - Optional suffix (defaults to "ƯƠM. Archive")
 */
export function useDocumentTitle(title: string, suffix: string = 'ƯƠM. Archive') {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : suffix
    document.title = fullTitle

    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = suffix
    }
  }, [title, suffix])
}
