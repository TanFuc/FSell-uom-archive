'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [mounted, setMounted] = useState(false)
  const [show, setShow] = useState(true)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShow(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!show}
    >
      <div className="relative">
        <h1 className="animate-pulse font-playfair text-6xl font-bold tracking-widest text-foreground md:text-8xl">
          ƯƠM.<span className="text-primary">.</span>
        </h1>
      </div>
    </div>
  )
}
