'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useSiteContent } from '@/hooks/use-settings'
import { getImageUrl } from '@/lib/utils'

export default function AboutClient() {
  const locale = useLocale() as 'vi' | 'en'
  const { data: content } = useSiteContent()

  const getVal = (key: string, fallback: string = '') => {
    if (!content) return fallback
    return content[`${key}.${locale}`] || content[`${key}.en`] || content[`${key}.vi`] || fallback
  }

  const storyImage = content?.['about.storyImage']
  const storyTitle = getVal('about.storyTitle', 'CÂU CHUYỆN CỦA CHÚNG TÔI')
  const brandName = 'ƯƠM.'
  const shopCta = locale === 'vi' ? 'Xem shop' : 'Visit the shop'
  const journalCta = locale === 'vi' ? 'Đọc Journal' : 'Read the journal'
  const faqTitle = locale === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked questions'

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
              <Image
                src={getImageUrl(storyImage)}
                alt={`${storyTitle} - ${brandName}`}
                fill
                className="object-cover"
              />
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

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center">
          <Link
            href={`/${locale}/shop`}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground underline decoration-foreground/15 underline-offset-8 transition hover:opacity-70"
          >
            {shopCta}
          </Link>
          <Link
            href={`/${locale}/journal`}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground underline decoration-foreground/15 underline-offset-8 transition hover:opacity-70"
          >
            {journalCta}
          </Link>
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

      {/* FAQ Section */}
      <section className="container-custom spacing-md">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-center uppercase tracking-[0.25em]">{faqTitle}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white/90 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                {locale === 'vi' ? 'ƯƠM. là gì?' : 'What is ƯƠM.?'}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {locale === 'vi'
                  ? 'ƯƠM. là không gian tuyển chọn gốm sứ thủ công Việt Nam, kết nối câu chuyện, nghệ nhân và khách hàng yêu giá trị thủ công.'
                  : 'ƯƠM. curates Vietnamese handcrafted ceramics, connecting artisan stories with customers who value craftsmanship.'}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/90 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                {locale === 'vi'
                  ? 'Tôi có thể xem bộ sưu tập ở đâu?'
                  : 'Where can I view the collection?'}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {locale === 'vi'
                  ? 'Bạn có thể xem đầy đủ bộ sưu tập tại trang Shop và lọc theo từng danh mục gốm sứ.'
                  : 'Browse the full collection on the Shop page and filter by ceramic categories.'}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/90 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                {locale === 'vi'
                  ? 'Làm sao để đặt hàng hoặc tư vấn?'
                  : 'How can I inquire or place an order?'}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {locale === 'vi'
                  ? 'Bạn có thể nhắn qua Instagram/Facebook hoặc gửi yêu cầu tại trang sản phẩm để được tư vấn chi tiết.'
                  : 'Message us via Instagram/Facebook or use the product inquiry section for detailed support.'}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/90 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.15em]">
                {locale === 'vi' ? 'Tôi nên bắt đầu từ đâu?' : 'Where should I start?'}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {locale === 'vi'
                  ? 'Hãy bắt đầu từ trang Journal để hiểu triết lý, sau đó khám phá các sản phẩm phù hợp với bạn.'
                  : 'Start with the Journal to understand our philosophy, then explore products that fit your style.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
