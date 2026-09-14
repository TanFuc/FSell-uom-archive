'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, RotateCcw, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ProductImageLightboxProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  productName: string
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3.5
const ZOOM_STEP = 0.5

export default function ProductImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  productName,
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }, [isOpen, initialIndex])

  // Reset zoom & pan when image changes
  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleNext = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
    resetZoom()
  }, [images.length, resetZoom])

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    resetZoom()
  }, [images.length, resetZoom])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(1))))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(1)))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        handleZoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        resetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose, handleNext, handlePrev, handleZoomIn, handleZoomOut, resetZoom])

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.deltaY < 0) {
        // Zoom in
        setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + 0.25).toFixed(2))))
      } else {
        // Zoom out
        setZoom((prev) => {
          const next = Math.max(MIN_ZOOM, Number((prev - 0.25).toFixed(2)))
          if (next === 1) setPan({ x: 0, y: 0 })
          return next
        })
      }
    },
    [],
  )

  // Toggle click zoom (1x <-> 2x)
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDragging) return

    if (zoom === 1) {
      setZoom(2)
    } else {
      resetZoom()
    }
  }

  // Pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!mounted) return null

  const currentImage = images[currentIndex]

  return createPortal(
    <AnimatePresence>
      {isOpen && images.length > 0 && currentImage && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md select-none"
        onClick={onClose}
      >
        {/* Top Control Bar */}
        <div
          className="relative z-10 flex h-16 w-full items-center justify-between px-4 sm:px-8 text-white/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Product info & counter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
              {productName}
            </span>
            {images.length > 1 && (
              <span className="text-[11px] font-medium tracking-wider text-white/50">
                ({currentIndex + 1} / {images.length})
              </span>
            )}
          </div>

          {/* Zoom controls & Close */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom Out"
              title="Thu nhỏ (-)"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            {/* Current Zoom Percentage (Click to reset) */}
            <button
              onClick={resetZoom}
              aria-label="Reset Zoom"
              title="Đặt lại phóng to (0)"
              className="hidden sm:flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-[11px] font-medium tracking-wider text-white transition hover:bg-white/20"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{Math.round(zoom * 100)}%</span>
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom In"
              title="Phóng to (+)"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div className="mx-1 h-5 w-[1px] bg-white/15" />

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              title="Đóng (Esc)"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/25 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Image Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn(
            'relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8',
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
          )}
        >
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70 sm:left-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/70 sm:right-8"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Scaled / Panned Image */}
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="flex h-full w-full items-center justify-center pointer-events-auto"
            onClick={handleImageClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={productName}
              draggable={false}
              className="max-h-[82vh] max-w-[90vw] object-contain select-none shadow-2xl drop-shadow-2xl"
            />
          </motion.div>
        </div>

        {/* Bottom Thumbnail Strip / Instruction Bar */}
        <div
          className="relative z-10 flex h-16 w-full items-center justify-center gap-2 px-4 pb-2 text-white/50"
          onClick={(e) => e.stopPropagation()}
        >
          {images.length > 1 ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx)
                    resetZoom()
                  }}
                  className={cn(
                    'relative h-10 w-10 shrink-0 overflow-hidden rounded-xs border transition-all',
                    idx === currentIndex
                      ? 'border-white ring-1 ring-white'
                      : 'border-white/20 opacity-50 hover:opacity-100',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] uppercase tracking-widest text-white/40">
              Nhấp hoặc cuộn chuột để phóng to / thu nhỏ
            </p>
          )}
        </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
