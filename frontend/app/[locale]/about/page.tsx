'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { useSiteContent } from '@/hooks/use-settings'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { getLocalizedValue, getImageUrl } from '@/lib/utils'

export default function AboutPage() {
  const t = useTranslations('Home') // Fallback translations
  const tNav = useTranslations('Navigation')
  const locale = useLocale() as 'vi' | 'en'
  const { data: content } = useSiteContent()

  // Update document title
  useDocumentTitle(tNav('about'))

  // Helper to get content or fallback
  const getVal = (key: string, fallback: string = '') => {
    if (!content) return fallback
    return content[`${key}.${locale}`] || content[`${key}.en`] || content[`${key}.vi`] || fallback
  }

  // Story Image
  const storyImage = content?.['about.storyImage'] 

  return (
    <div className="pt-16 md:pt-32 pb-16 md:pb-32">
      {/* Hero */}
      <section className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl uppercase tracking-[0.2em] mb-8 animate-fade-in">
            {getVal('about.heroTitle', 'VỀ ƯƠM ARCHIVE')}
          </h1>
          <p className="text-muted-foreground leading-relaxed animate-slide-up">
            {getVal('about.heroSubtitle', 'Câu chuyện về những bàn tay khéo léo và trái tim đam mê')}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-custom spacing-md">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="aspect-square bg-muted/30 overflow-hidden stagger-children relative rounded-lg">
            {storyImage ? (
              <Image 
                src={getImageUrl(storyImage)} 
                alt="Story" 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Story Image
              </div>
            )}
          </div>
          <div className="space-y-6 stagger-children">
            <h2 className="uppercase tracking-wider">
              {getVal('about.storyTitle', 'CÂU CHUYỆN CỦA CHÚNG TÔI')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
              {getVal('about.storyContent', 'Ươm Archive được sinh ra từ niềm đam mê...')}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-muted/20 spacing-md">
        <div className="container-custom py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6 stagger-children">
            <h2 className="uppercase tracking-wider">
              {getVal('about.philosophyTitle', 'TRIẾT LÝ THIẾT KẾ')}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium">
              {getVal('about.philosophyDescription', 'Tối giản, chân thật, bền vững.')}
            </p>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {getVal('about.philosophyContent', 'Ba từ này định hình mọi quyết định của chúng tôi...')}
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="container-custom spacing-md">
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 stagger-children">
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.craft.title', 'THỦ CÔNG')}
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {getVal('about.values.craft.description', 'Mỗi sản phẩm được chọn lọc kỹ lưỡng...')}
            </p>
          </div>
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.sustainability.title', 'BỀN VỮNG')}
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {getVal('about.values.sustainability.description', 'Chúng tôi ưu tiên các sản phẩm...')}
            </p>
          </div>
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.essence.title', 'TINH TẾ')}
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {getVal('about.values.essence.description', 'Vẻ đẹp nằm trong sự đơn giản...')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
