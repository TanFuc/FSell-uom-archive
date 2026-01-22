'use client'

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="relative">
        <h1 className="font-playfair font-bold text-6xl md:text-8xl tracking-widest animate-pulse text-foreground">
          ƯƠM<span className="text-primary">.</span>
        </h1>
      </div>
    </div>
  )
}
