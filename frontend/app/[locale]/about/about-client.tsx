'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useSiteContent } from '@/hooks/use-settings'
import { getImageUrl } from '@/lib/utils'

export default function AboutClient() {
  const locale = useLocale() as 'vi' | 'en'
  const { data: content } = useSiteContent()

  // Helper to get content or fallback
  const getVal = (key: string, fallback: string = '') => {
    if (!content) return fallback
    return content[`${key}.${locale}`] || content[`${key}.en`] || content[`${key}.vi`] || fallback
  }

  // Story Image
  const storyImage = content?.['about.storyImage']

  return (
    <div className="pb-16 pt-16 md:pb-32 md:pt-32">
      {/* Hero */}
      <section className="container-custom">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="animate-fade-in mb-8 text-2xl uppercase tracking-[0.2em] md:text-3xl">
            {getVal('about.heroTitle', 'VỀ ƯƠM. ARCHIVE')}
          </h1>
          <p className="animate-slide-up leading-relaxed text-muted-foreground">
            {getVal(
              'about.heroSubtitle',
              'Câu chuyện về những bàn tay khéo léo và trái tim đam mê',
            )}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-custom spacing-md">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="stagger-children relative aspect-square overflow-hidden rounded-lg bg-muted/30">
            {storyImage ? (
              <Image src={getImageUrl(storyImage)} alt="Story" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Story Image
              </div>
            )}
          </div>
          <div className="stagger-children space-y-6">
            <h2 className="uppercase tracking-wider">
              {getVal('about.storyTitle', 'CÂU CHUYỆN CỦA CHÚNG TÔI')}
            </h2>
            <div className="space-y-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {getVal('about.storyContent', 'ƯƠM. Archive được sinh ra từ niềm đam mê...')}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="spacing-md bg-muted/20">
        <div className="container-custom py-16 md:py-24">
          <div className="stagger-children mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="uppercase tracking-wider">
              {getVal('about.philosophyTitle', 'TRIẾT LÝ THIẾT KẾ')}
            </h2>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground">
              {getVal('about.philosophyDescription', 'Tối giản, chân thật, bền vững.')}
            </p>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {getVal(
                'about.philosophyContent',
                'Ba từ này định hình mọi quyết định của chúng tôi...',
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="container-custom spacing-md">
        <div className="stagger-children grid gap-12 md:grid-cols-3 md:gap-16">
          <div className="space-y-4 text-center">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.craft.title', 'THỦ CÔNG')}
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {getVal('about.values.craft.description', 'Mỗi sản phẩm được chọn lọc kỹ lưỡng...')}
            </p>
          </div>
          <div className="space-y-4 text-center">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.sustainability.title', 'BỀN VỮNG')}
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {getVal(
                'about.values.sustainability.description',
                'Chúng tôi ưu tiên các sản phẩm...',
              )}
            </p>
          </div>
          <div className="space-y-4 text-center">
            <h3 className="uppercase tracking-wider">
              {getVal('about.values.essence.title', 'TINH TẾ')}
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {getVal('about.values.essence.description', 'Vẻ đẹp nằm trong sự đơn giản...')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
