'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getImageUrl } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-product bg-earthy-cream flex items-center justify-center text-earthy-clay">
        No images available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-product overflow-hidden bg-earthy-cream">
        <Image
          src={getImageUrl(images[activeIndex])}
          alt={`${alt} - Image ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-opacity duration-500"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`relative w-16 h-20 flex-shrink-0 overflow-hidden transition-opacity ${
                index === activeIndex ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
            >
              <Image
                src={getImageUrl(image)}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
