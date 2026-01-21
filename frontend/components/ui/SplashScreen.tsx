'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!show}
    >
      <div className="relative">
        <h1 className="font-playfair font-bold text-6xl md:text-8xl tracking-widest animate-pulse text-foreground">
          ƯƠM<span className="text-primary">.</span>
        </h1>
      </div>
    </div>
  )
}
