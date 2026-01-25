'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface LogoProps {
  variant?: 'svg' | 'png' | 'png-bg' | 'text'
  width?: number
  height?: number
  className?: string
  linkToHome?: boolean
  customHref?: string // Custom link destination
}

export default function Logo({
  variant = 'text',
  width = 120,
  height = 40,
  className = '',
  linkToHome = true,
  customHref,
}: LogoProps) {
  const locale = useLocale()

  const logoContent = () => {
    if (variant === 'text') {
      return (
        <span className={`font-serif uppercase tracking-[0.3em] text-foreground ${className}`}>
          ƯƠM.
        </span>
      )
    }

    const logoSrc = {
      svg: '/assets/logo.svg',
      png: '/assets/logo-remove.png',
      'png-bg': '/assets/logo.png',
    }[variant]

    return (
      <Image
        src={logoSrc}
        alt={locale === 'vi' ? 'ƯƠM. Archive' : 'Uom Archive'}
        width={width}
        height={height}
        priority
        className={className}
      />
    )
  }

  if (linkToHome || customHref) {
    const href = customHref || `/${locale}`
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {logoContent()}
      </Link>
    )
  }

  return logoContent()
}
