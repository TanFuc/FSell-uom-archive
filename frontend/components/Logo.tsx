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
}

export default function Logo({
  variant = 'text',
  width = 120,
  height = 40,
  className = '',
  linkToHome = true,
}: LogoProps) {
  const locale = useLocale()

  const logoContent = () => {
    if (variant === 'text') {
      return (
        <span className={`text-earthy-brown uppercase tracking-widest ${className}`}>
          Ươm Archive
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
        alt={locale === 'vi' ? 'Ươm Archive' : 'Uom Archive'}
        width={width}
        height={height}
        priority
        className={className}
      />
    )
  }

  if (linkToHome) {
    return (
      <Link href={`/${locale}`} className="hover:italic transition-all">
        {logoContent()}
      </Link>
    )
  }

  return logoContent()
}
