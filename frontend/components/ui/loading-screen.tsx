'use client'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="relative">
        <h1 className="animate-pulse font-playfair text-6xl font-bold tracking-widest text-foreground md:text-8xl">
          ƯƠM<span className="text-primary">.</span>
        </h1>
      </div>
    </div>
  )
}
