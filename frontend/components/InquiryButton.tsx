'use client'

import { Facebook, Instagram, MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  generateFacebookInquiryUrl,
  generateInstagramInquiryUrl,
  getInquiryMessage,
} from '@/lib/inquiry'
import { type Product, type SocialLinks, type Locale } from '@/lib/types'

interface InquiryButtonProps {
  product: Product
  socialLinks: SocialLinks
  locale: Locale
  exchangeRate?: number
}

export default function InquiryButton({
  product,
  socialLinks,
  locale,
  exchangeRate,
}: InquiryButtonProps) {
  const t = useTranslations('product')

  if (!product.inquiryEnabled) {
    return <p className="italic text-muted-foreground">{t('contactForAvailability')}</p>
  }

  const message = getInquiryMessage(product, locale, exchangeRate)

  const handleFacebookClick = () => {
    const url = generateFacebookInquiryUrl(socialLinks.facebookPageUrl, message)
    window.open(url, '_blank')
  }

  const handleInstagramClick = () => {
    const url = generateInstagramInquiryUrl(socialLinks.instagramUsername, message)
    window.open(url, '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 font-normal uppercase tracking-wide hover:bg-transparent hover:italic"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {t('askAboutProduct')}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="border-border bg-background">
        {socialLinks.facebookPageUrl && (
          <DropdownMenuItem
            onClick={handleFacebookClick}
            className="cursor-pointer hover:bg-accent"
          >
            <Facebook className="mr-2 h-4 w-4" />
            {t('facebook')}
          </DropdownMenuItem>
        )}

        {socialLinks.instagramUsername && (
          <DropdownMenuItem
            onClick={handleInstagramClick}
            className="cursor-pointer hover:bg-accent"
          >
            <Instagram className="mr-2 h-4 w-4" />
            {t('instagram')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
