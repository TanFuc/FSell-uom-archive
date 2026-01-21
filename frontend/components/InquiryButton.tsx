'use client'

import { useTranslations } from 'next-intl'
import { Facebook, Instagram, MessageSquare } from 'lucide-react'
import { Product, SocialLinks, Locale } from '@/lib/types'
import {
  generateFacebookInquiryUrl,
  generateInstagramInquiryUrl,
  getInquiryMessage,
} from '@/lib/inquiry'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

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
    return (
      <p className="text-muted-foreground italic">
        {t('contactForAvailability')}
      </p>
    )
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
          className="uppercase tracking-wide hover:italic hover:bg-transparent p-0 h-auto font-normal"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {t('askAboutProduct')}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="bg-background border-border">
        {socialLinks.facebookPageUrl && (
          <DropdownMenuItem
            onClick={handleFacebookClick}
            className="cursor-pointer hover:bg-accent"
          >
            <Facebook className="w-4 h-4 mr-2" />
            {t('facebook')}
          </DropdownMenuItem>
        )}

        {socialLinks.instagramUsername && (
          <DropdownMenuItem
            onClick={handleInstagramClick}
            className="cursor-pointer hover:bg-accent"
          >
            <Instagram className="w-4 h-4 mr-2" />
            {t('instagram')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
