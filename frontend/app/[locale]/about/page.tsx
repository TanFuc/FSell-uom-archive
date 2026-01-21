import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Ươm Archive',
  description: 'Discover the story behind Ươm Archive - preserving Vietnamese artisan crafts',
}

export default function AboutPage() {
  return (
    <div className="spacing-xl">
      {/* Hero */}
      <section className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl uppercase tracking-[0.2em] mb-8 animate-fade-in">
            VỀ ƯƠM ARCHIVE
          </h1>
          <p className="text-muted-foreground leading-relaxed animate-slide-up">
            Câu chuyện về những bàn tay khéo léo và trái tim đam mê
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container-custom spacing-md">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="aspect-square bg-muted/30 overflow-hidden stagger-children">
            {/* Replace with actual image */}
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Story Image
            </div>
          </div>
          <div className="space-y-6 stagger-children">
            <h2 className="uppercase tracking-wider">CÂU CHUYỆN CỦA CHÚNG TÔI</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Ươm Archive được sinh ra từ niềm đam mê với nghệ thuật thủ công truyền thống Việt Nam. 
                Chúng tôi hành trình khắp các làng nghề để tìm kiếm những món đồ độc đáo, 
                được làm bằng tay với tâm huyết.
              </p>
              <p>
                Mỗi sản phẩm không chỉ là vật dụng, mà là câu chuyện của người nghệ nhân, 
                là di sản văn hóa được lưu giữ qua thời gian.
              </p>
              <p>
                Chúng tôi tin rằng trong thế giới hiện đại đầy ắp sản phẩm công nghiệp, 
                những món đồ thủ công mang giá trị không chỉ về mặt thẩm mỹ mà còn về mặt tinh thần.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-muted/20 spacing-md">
        <div className="container-custom py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6 stagger-children">
            <h2 className="uppercase tracking-wider">TRIẾT LÝ THIẾT KẾ</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Tối giản, chân thật, bền vững.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Ba từ này định hình mọi quyết định của chúng tôi - từ cách chọn sản phẩm 
              đến cách trình bày chúng. Chúng tôi loại bỏ mọi thứ không cần thiết để 
              làm nổi bật vẻ đẹp tinh khiết của từng món đồ.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="container-custom spacing-md">
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 stagger-children">
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">THỦ CÔNG</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mỗi sản phẩm được chọn lọc kỹ lưỡng từ các nghệ nhân Việt Nam, 
              đảm bảo chất lượng và tính độc đáo.
            </p>
          </div>
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">BỀN VỮNG</h3>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi ưu tiên các sản phẩm được làm từ nguyên liệu tự nhiên, 
              thân thiện với môi trường.
            </p>
          </div>
          <div className="text-center space-y-4">
            <h3 className="uppercase tracking-wider">TINH TẾ</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vẻ đẹp nằm trong sự đơn giản. Mỗi chi tiết được chăm chút 
              để tạo nên tổng thể hài hòa.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
