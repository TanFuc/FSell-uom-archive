import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uomarchive.com' },
    update: {},
    create: {
      email: 'admin@uomarchive.com',
      passwordHash,
      fullName: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
    },
  })

  const managerPasswordHash = await bcrypt.hash('manager123', 10)

  await prisma.user.upsert({
    where: { email: 'manager@uomarchive.com' },
    update: {},
    create: {
      email: 'manager@uomarchive.com',
      passwordHash: managerPasswordHash,
      fullName: 'Manager User',
      role: Role.MANAGER,
      isActive: true,
      createdBy: admin.id,
    },
  })

  await prisma.themeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      backgroundColor: '#F9F7F1',
      textColor: '#4A4238',
      accentColor: '#8C7E6A',
    },
  })

  await prisma.socialSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      facebookPageUrl: 'https://m.me/uomarchive',
      instagramUsername: 'uomarchive',
    },
  })

  const seededStories = [
    {
      id: 'story-nhung-ban-tay-giu-lua',
      slug: 'nhung-ban-tay-giu-lua-lang-gom',
      slugVi: 'nhung-ban-tay-giu-lua-lang-gom',
      slugEn: 'hands-that-keep-the-kiln-burning',
      titleVi: 'Những Bàn Tay Giữ Lửa Làng Gốm',
      titleEn: 'Hands That Keep the Kiln Burning',
      summaryVi:
        'Một buổi sáng ở xưởng, nơi nhịp xoay bàn gốm, mùi đất ẩm và hơi lửa tạo nên bản hòa âm của sự kiên nhẫn.',
      summaryEn:
        'A morning in the workshop where wheel rhythm, wet clay scent, and kiln heat compose a quiet symphony of patience.',
      contentVi: `
        <h2>Bắt đầu từ một nhúm đất</h2>
        <p>Mỗi chiếc bình bắt đầu bằng một nhúm đất nhỏ, được nhào kỹ cho đến khi bề mặt mịn như lụa. Người thợ không vội. Họ lắng nghe độ ẩm, độ đàn hồi, và cả "tính khí" riêng của từng mẻ đất.</p>
        <p>Ở ƯƠM., chúng tôi luôn tin rằng vẻ đẹp bền vững không đến từ sự hoàn hảo tuyệt đối, mà đến từ sự chân thật trong từng dấu vân tay còn lại sau quá trình tạo tác.</p>
        <h3>Giữ lửa cho chất lượng</h3>
        <p>Công đoạn nung kéo dài nhiều giờ, đòi hỏi kiểm soát nhiệt độ chính xác. Một thay đổi nhỏ trong ngọn lửa có thể tạo nên lớp men chuyển sắc hoàn toàn khác biệt.</p>
        <blockquote>"Mỗi mẻ nung là một lần học lại cách khiêm tốn trước chất liệu."</blockquote>
        <p>Khi lấy sản phẩm ra khỏi lò, chúng tôi kiểm tra thủ công từng chi tiết: chân đế, độ phẳng miệng bình, và sắc men dưới ánh sáng tự nhiên.</p>
      `,
      contentEn: `
        <h2>It starts with a handful of clay</h2>
        <p>Every vase begins with a small handful of clay, kneaded until the surface feels silky. The artisan never rushes. They read moisture, elasticity, and the unique "temperament" of each clay batch.</p>
        <p>At UOM., we believe timeless beauty does not come from absolute perfection, but from honesty in every fingerprint left by the making process.</p>
        <h3>Keeping the fire for quality</h3>
        <p>Firing takes hours and demands precise temperature control. A subtle shift in flame can produce a completely different glaze transition.</p>
        <blockquote>"Each firing teaches us humility in front of material."</blockquote>
        <p>When pieces leave the kiln, we inspect each one by hand: the base, rim balance, and glaze tone under natural light.</p>
      `,
      imageUrl:
        'https://images.unsplash.com/photo-1601055903647-ddf1ee9701b1?q=80&w=1800&auto=format&fit=crop',
      publishedAt: '2026-03-12',
    },
    {
      id: 'story-mau-men-va-anh-sang',
      slug: 'mau-men-va-anh-sang-trong-nha',
      slugVi: 'mau-men-va-anh-sang-trong-nha',
      slugEn: 'glaze-tones-in-natural-light',
      titleVi: 'Màu Men và Ánh Sáng Trong Nhà',
      titleEn: 'Glaze Tones in Natural Light',
      summaryVi:
        'Cùng một chiếc cốc, màu men có thể thay đổi tinh tế theo nắng sớm, chiều muộn hay ánh đèn vàng trong phòng khách.',
      summaryEn:
        'The same cup can reveal different glaze moods across morning sun, late afternoon shadows, and warm indoor lighting.',
      contentVi: `
        <h2>Vì sao men gốm "đổi sắc"?</h2>
        <p>Men gốm phản ứng rất nhạy với nguồn sáng. Dưới ánh nắng tán xạ, các lớp men mờ cho cảm giác dịu và sâu. Trong ánh đèn vàng, sắc men lại trở nên ấm và gần gũi hơn.</p>
        <p>Đó là lý do chúng tôi chụp sản phẩm ở nhiều điều kiện ánh sáng khác nhau để bạn hình dung chân thực nhất trước khi chọn mua.</p>
        <h3>Gợi ý phối trong không gian sống</h3>
        <ul>
          <li><strong>Góc bếp sáng:</strong> ưu tiên men ngà, be, kem để tăng cảm giác sạch và nhẹ.</li>
          <li><strong>Phòng khách tông ấm:</strong> chọn men nâu đất hoặc xanh rêu để tạo điểm nhấn tự nhiên.</li>
          <li><strong>Bàn trà tối giản:</strong> phối 2-3 tông men gần nhau để tổng thể hài hòa.</li>
        </ul>
        <p>Một món đồ gốm đẹp không chỉ nằm ở hình dáng, mà còn ở cách nó "sống" cùng ánh sáng trong ngôi nhà của bạn.</p>
      `,
      contentEn: `
        <h2>Why does glaze seem to shift in color?</h2>
        <p>Ceramic glaze is highly sensitive to light sources. Under diffused daylight, matte layers appear calm and deep. Under warm lamps, tones become softer and more intimate.</p>
        <p>That is why we photograph each piece in multiple lighting conditions, so you can choose with confidence.</p>
        <h3>Styling suggestions for your home</h3>
        <ul>
          <li><strong>Bright kitchen corners:</strong> ivory, beige, and cream glazes keep the atmosphere airy.</li>
          <li><strong>Warm living rooms:</strong> earthy brown or moss green glazes create natural focal points.</li>
          <li><strong>Minimal tea table:</strong> combine 2-3 close glaze tones for visual harmony.</li>
        </ul>
        <p>A beautiful ceramic object is not only about form, but about how it lives with the light in your home.</p>
      `,
      imageUrl:
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1800&auto=format&fit=crop',
      publishedAt: '2026-03-20',
    },
    {
      id: 'story-nghi-thuc-ban-tra-toi-gian',
      slug: 'nghi-thuc-ban-tra-toi-gian',
      slugVi: 'nghi-thuc-ban-tra-toi-gian',
      slugEn: 'minimal-tea-ritual-at-home',
      titleVi: 'Nghi Thức Bàn Trà Tối Giản',
      titleEn: 'A Minimal Tea Ritual at Home',
      summaryVi:
        'Không cần quá nhiều vật dụng, chỉ vài món gốm đúng tinh thần là đủ để biến mỗi buổi trà thành một khoảng thở nhẹ nhàng.',
      summaryEn:
        'You do not need many objects, only a few thoughtful ceramic pieces to turn daily tea into a calm ritual.',
      contentVi: `
        <h2>Ít hơn, nhưng tinh hơn</h2>
        <p>Một bàn trà tối giản thường chỉ cần 4 yếu tố: ấm, 2-3 chén, khay và một bình hoa nhỏ. Khoảng trống giữa các món đồ cũng quan trọng như chính chúng.</p>
        <p>Khi mọi thứ được đặt đúng chỗ, nhịp sống chậm lại. Việc rót trà trở thành một chuyển động có ý thức, không còn là thao tác vội vàng.</p>
        <h3>3 nguyên tắc nhỏ để bắt đầu</h3>
        <ol>
          <li>Giữ bảng màu trung tính để mắt được nghỉ.</li>
          <li>Dùng chất liệu tự nhiên như gốm mộc, gỗ, vải thô.</li>
          <li>Luôn để lại một khoảng trống trên khay trà.</li>
        </ol>
        <p>Ở cuối ngày, một tách trà trong chiếc chén vừa tay có thể là cách đơn giản nhất để trở về với sự bình an.</p>
      `,
      contentEn: `
        <h2>Less, but more intentional</h2>
        <p>A minimal tea setup only needs four elements: a teapot, 2-3 cups, a tray, and a small flower vase. The empty space between objects matters as much as the objects themselves.</p>
        <p>When every piece is placed with intention, time slows down. Pouring tea becomes mindful movement rather than a rushed routine.</p>
        <h3>Three simple rules to begin</h3>
        <ol>
          <li>Keep a neutral palette so the eyes can rest.</li>
          <li>Use natural materials such as raw ceramic, wood, and linen.</li>
          <li>Always leave breathing space on your tea tray.</li>
        </ol>
        <p>At the end of the day, a cup of tea in a well-balanced handmade cup can be the simplest way back to calm.</p>
      `,
      imageUrl:
        'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=1800&auto=format&fit=crop',
      publishedAt: '2026-03-28',
    },
    {
      id: 'story-sac-do-thu-cong-va-khong-gian-song',
      slug: 'sac-do-thu-cong-va-khong-gian-song',
      slugVi: 'sap-do-thu-cong-trong-khong-gian-song',
      slugEn: 'styling-handmade-pieces-in-living-spaces',
      titleVi: 'Sắp Đồ Thủ Công Trong Không Gian Sống',
      titleEn: 'Styling Handmade Pieces in Living Spaces',
      summaryVi:
        'Một vài nguyên tắc nhỏ về tỷ lệ, chất liệu và khoảng thở giúp đồ gốm thủ công nổi bật tự nhiên mà không làm không gian bị nặng.',
      summaryEn:
        'A few simple principles of scale, material, and breathing space can make handmade ceramics stand out naturally without overwhelming a room.',
      contentVi: `
        <h2>Đặt đúng chỗ quan trọng hơn đặt thật nhiều</h2>
        <p>Khi sắp đồ thủ công, điều đầu tiên cần chú ý là tỷ lệ giữa vật thể và mặt phẳng trưng bày. Một chiếc bình cao sẽ đẹp hơn khi đi cùng một món thấp, thay vì đứng giữa quá nhiều đồ ngang tầm.</p>
        <p>Hãy để mắt người có đường dẫn: từ món chính, sang món phụ, rồi dừng ở một khoảng trống. Khoảng trống đó giúp tổng thể "thở" và khiến món đồ chính nổi bật hơn.</p>
        <h3>Công thức phối nhanh 60-30-10</h3>
        <ul>
          <li><strong>60%</strong> tông nền trung tính: kem, be, nâu nhạt.</li>
          <li><strong>30%</strong> vật liệu tự nhiên: gỗ, linen, mây.</li>
          <li><strong>10%</strong> điểm nhấn men đậm: rêu, nâu đất, xanh xám.</li>
        </ul>
        <p>Chỉ cần giữ công thức này, bạn đã có một góc trưng bày tinh tế và đồng nhất với tinh thần tối giản.</p>
      `,
      contentEn: `
        <h2>Placement matters more than quantity</h2>
        <p>When styling handmade pieces, start with scale. A tall vase often looks better paired with one lower object, rather than surrounded by many items of similar height.</p>
        <p>Create a visual path for the eye: from a primary object to a secondary one, then to a deliberate empty zone. That empty zone gives the arrangement room to breathe.</p>
        <h3>The quick 60-30-10 styling rule</h3>
        <ul>
          <li><strong>60%</strong> neutral base tones: cream, beige, soft brown.</li>
          <li><strong>30%</strong> natural materials: wood, linen, rattan.</li>
          <li><strong>10%</strong> richer glaze accents: moss, earthy brown, slate blue.</li>
        </ul>
        <p>With this balance, your display stays elegant, cohesive, and true to a minimal handmade aesthetic.</p>
      `,
      imageUrl:
        'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1800&auto=format&fit=crop',
      publishedAt: '2026-04-02',
    },
    {
      id: 'story-tu-xuong-gom-den-ban-an',
      slug: 'tu-xuong-gom-den-ban-an',
      slugVi: 'tu-xuong-gom-den-ban-an',
      slugEn: 'from-workshop-to-table',
      titleVi: 'Từ Xưởng Gốm Đến Bàn Ăn',
      titleEn: 'From Workshop to Table',
      summaryVi:
        'Hành trình của một bộ chén đĩa đi qua tạo hình, nung men, kiểm tra thủ công và đóng gói trước khi xuất hiện trong bữa cơm gia đình.',
      summaryEn:
        'The journey of a dinnerware set through shaping, firing, hand inspection, and packing before arriving at your daily table.',
      contentVi: `
        <h2>Mỗi bộ chén là một chuỗi công đoạn tỉ mỉ</h2>
        <p>Sau khi tạo hình, sản phẩm được hong khô tự nhiên để tránh nứt vỡ trong lò. Tiếp đó là lần nung đầu để cố định kết cấu trước khi phủ men.</p>
        <p>Lớp men không chỉ để đẹp. Nó quyết định cảm giác khi cầm, độ an toàn khi sử dụng hằng ngày và cách bề mặt phản chiếu ánh sáng trên bàn ăn.</p>
        <h3>Kiểm tra chất lượng trước khi đóng gói</h3>
        <ol>
          <li>Độ phẳng của chân đế để không kênh trên mặt bàn.</li>
          <li>Độ đều của lớp men ở vành tiếp xúc thực phẩm.</li>
          <li>Âm thanh khi gõ nhẹ để nhận biết kết cấu nung đạt chuẩn.</li>
        </ol>
        <p>Chúng tôi muốn mỗi món đồ không chỉ đẹp trong ảnh, mà còn thực sự tiện và bền trong đời sống hằng ngày.</p>
      `,
      contentEn: `
        <h2>Every set is the result of careful stages</h2>
        <p>After shaping, pieces are naturally dried to reduce cracking risks in the kiln. A first firing stabilizes the body before glazing begins.</p>
        <p>Glaze is not only visual. It defines tactile feel, daily usability, and the way surfaces catch light at the table.</p>
        <h3>Quality checks before packing</h3>
        <ol>
          <li>Base flatness, so pieces sit stable on the table.</li>
          <li>Consistent glaze around food-contact edges.</li>
          <li>Ring sound test to confirm proper firing structure.</li>
        </ol>
        <p>Our goal is simple: each piece should feel as good in real life as it looks in photos.</p>
      `,
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1800&auto=format&fit=crop',
      publishedAt: '2026-04-04',
    },
  ]

  const defaultContent = [
    { key: 'menu.shop.vi', value: 'SẢN PHẨM' },
    { key: 'menu.shop.en', value: 'SHOP' },
    { key: 'menu.inquiry.vi', value: 'HỎI SẢN PHẨM' },
    { key: 'menu.inquiry.en', value: 'INQUIRE' },
    { key: 'menu.shipping.vi', value: 'VẬN CHUYỂN & ĐỔI TRẢ' },
    { key: 'menu.shipping.en', value: 'SHIPPING & RETURNS' },
    { key: 'brand.name.vi', value: 'ƯƠM. Archive' },
    { key: 'brand.name.en', value: 'ƯƠM. Archive' },
    { key: 'footer.text.vi', value: '© 2026 ƯƠM. Archive. Tất cả quyền được bảo lưu.' },
    { key: 'footer.text.en', value: '© 2026 ƯƠM. Archive. All rights reserved.' },
    { key: 'hero.title.vi', value: 'Vẻ đẹp trong sự tĩnh lặng' },
    { key: 'hero.title.en', value: 'Beauty in Stillness' },
    { key: 'hero.subtitle.vi', value: 'Gốm sứ thủ công từ Việt Nam' },
    { key: 'hero.subtitle.en', value: 'Handcrafted ceramics from Vietnam' },
    { key: 'inquiry.button.vi', value: 'Hỏi sản phẩm' },
    { key: 'inquiry.button.en', value: 'Inquire' },
    {
      key: 'hero.image.vi',
      value:
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop',
    },
    {
      key: 'hero.image.en',
      value:
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop',
    },
    {
      key: 'journal.stories',
      value: JSON.stringify(seededStories),
    },
    {
      key: 'search.trending.vi',
      value: JSON.stringify([
        'binh gom',
        'chen tra',
        'men ran',
        'bo suu tap moi',
        'lo hoa toi gian',
      ]),
    },
    {
      key: 'search.trending.en',
      value: JSON.stringify([
        'ceramic vase',
        'tea cup',
        'crackle glaze',
        'new collection',
        'minimal decor',
      ]),
    },
  ]

  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    })
  }

  await prisma.siteSettings.upsert({
    where: { key: 'exchange_rate' },
    update: {},
    create: { key: 'exchange_rate', value: '25000' },
  })

  const brandingDefaults = [
    { key: 'site.title.vi', value: 'ƯƠM. Archive - Gốm sứ thủ công Việt Nam' },
    { key: 'site.title.en', value: 'ƯƠM. Archive - Handcrafted Ceramics from Vietnam' },
    { key: 'site.description.vi', value: 'Gốm sứ thủ công được tuyển chọn kỹ lưỡng từ Việt Nam.' },
    {
      key: 'site.description.en',
      value: 'Discover timeless Vietnamese ceramics curated with care.',
    },
    { key: 'site.logoUrl', value: '' },
    { key: 'site.loadingText', value: 'ƯƠM.' },
  ]

  for (const item of brandingDefaults) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    })
  }

  const sampleProducts = [
    {
      slug: 'binh-gom-trang-lieng',
      nameVi: 'Bình Gốm Liêng',
      nameEn: 'Lieng Ceramic Vase',
      descriptionVi:
        'Bình gốm dáng cao với men trắng ngà tự nhiên, bề mặt có độ nhám nhẹ thủ công. Phù hợp cắm hoa cành khô hoặc trưng bày độc lập.',
      descriptionEn:
        'Tall ceramic vase with natural ivory glaze, featuring a subtle handcrafted texture. Perfect for dried branches or standing alone as a statement piece.',
      priceVND: 1850000,
      images: [
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Đất sét trắng / White clay',
      dimensions: '18cm x 45cm',
      stock: 5,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến sản phẩm "Bình Gốm Liêng".\n\nGiá: 1,850,000₫\n\nBạn tư vấn thêm giúp tôi nhé.`,
      inquiryMessageEn: `Hi! I'm interested in the "Lieng Ceramic Vase".\n\nPrice: 1,850,000₫\n\nPlease provide more details.`,
      createdBy: admin.id,
    },
    {
      slug: 'bo-chen-dia-moc',
      nameVi: 'Bộ Chén Đĩa Mộc',
      nameEn: 'Moc Dinnerware Set',
      descriptionVi:
        'Bộ sưu tập bàn ăn "Mộc" tôn vinh vẻ đẹp nguyên bản của đất. Nung củi truyền thống tạo ra những vệt màu ngẫu nhiên độc đáo.',
      descriptionEn:
        'The "Moc" dinnerware collection honors the raw beauty of earth. Traditional wood firing creates unique, random color trails on each piece.',
      priceVND: 3200000,
      images: [
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Gốm sành / Stoneware',
      dimensions: 'Đa dạng / Assorted',
      stock: 3,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi muốn đặt mua "Bộ Chén Đĩa Mộc".`,
      inquiryMessageEn: `Hi! I'd like to order the "Moc Dinnerware Set".`,
      createdBy: admin.id,
    },
    {
      slug: 'lo-hoa-be-tho',
      nameVi: 'Lọ Hoa Bê Thở',
      nameEn: "'Breathing' Concrete Vase",
      descriptionVi:
        'Sự kết hợp táo bạo giữa gốm và chất liệu xi măng thô ráp. Thiết kế hiện đại, hình khối mạnh mẽ.',
      descriptionEn:
        'A bold combination of ceramics and raw concrete texture. Modern design with strong geometric layout.',
      priceVND: 950000,
      images: [
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Gốm lai xi măng / Ceramic-concrete hybrid',
      dimensions: '22cm x 22cm',
      stock: 12,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Tư vấn giúp mình mẫu "Lọ Hoa Bê Thở" nhé.`,
      inquiryMessageEn: `Please tell me more about the "'Breathing' Concrete Vase".`,
      createdBy: admin.id,
    },
    {
      slug: 'coc-uong-tra-nham',
      nameVi: 'Cốc Trà Nhám',
      nameEn: 'Textured Tea Cup',
      descriptionVi:
        'Cốc trà không quai, cầm vừa tay, lớp men nhám giữ nhiệt tốt và tạo cảm giác ấm áp khi cầm vào mùa đông.',
      descriptionEn:
        'Handleless tea cup, perfect fit in hand. Matte textured glaze retains heat well and offers a warm tactile feel in winter.',
      priceVND: 250000,
      images: [
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Gốm tráng men mờ / Matte glazed ceramic',
      dimensions: '8cm x 6cm',
      stock: 50,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Mình muốn mua số lượng lớn "Cốc Trà Nhám" làm quà tặng.`,
      inquiryMessageEn: `I'm interested in buying "Textured Tea Cup" in bulk for gifts.`,
      createdBy: admin.id,
    },
    {
      slug: 'dia-gom-men-ran',
      nameVi: 'Đĩa Gốm Men Rạn',
      nameEn: 'Crackle Glaze Plate',
      descriptionVi:
        'Đĩa gốm với kỹ thuật men rạn cổ điển, màu xanh ngọc bích sẫm. Sang trọng và hoài cổ.',
      descriptionEn:
        'Ceramic plate featuring classic crackle glaze technique in deep jade green. Elegant and nostalgic.',
      priceVND: 550000,
      images: [
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Gốm men rạn / Crackle wear',
      dimensions: '26cm diameter',
      stock: 18,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Sản phẩm "Đĩa Gốm Men Rạn" còn hàng không ạ?`,
      inquiryMessageEn: `Is the "Crackle Glaze Plate" still in stock?`,
      createdBy: admin.id,
    },
    {
      slug: 'binh-hoa-abstract',
      nameVi: 'Bình Hoa Abstract',
      nameEn: 'Abstract Form Vase',
      descriptionVi:
        'Thiết kế trừu tượng với các đường cong bất đối xứng. Vừa là lọ hoa, vừa là tượng điêu khắc nghệ thuật.',
      descriptionEn:
        'Abstract design with Asymmetric curves. Functions as both a flower vase and an art sculpture.',
      priceVND: 2100000,
      images: [
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Đất cao lanh / Kaolin',
      dimensions: '30cm x 18cm',
      stock: 4,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Tôi rất thích mẫu "Bình Hoa Abstract".`,
      inquiryMessageEn: `I love the "Abstract Form Vase".`,
      createdBy: admin.id,
    },
    {
      slug: 'binh-hoa-abstract-copy',
      nameVi: 'Bình Hoa Abstract (Copy)',
      nameEn: 'Abstract Form Vase (Copy)',
      descriptionVi:
        'Thiết kế trừu tượng với các đường cong bất đối xứng. Vừa là lọ hoa, vừa là tượng điêu khắc nghệ thuật.',
      descriptionEn:
        'Abstract design with Asymmetric curves. Functions as both a flower vase and an art sculpture.',
      priceVND: 2100000,
      images: [
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop',
      ],
      material: 'Đất cao lanh / Kaolin',
      dimensions: '30cm x 18cm',
      stock: 4,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Tôi rất thích mẫu "Bình Hoa Abstract".`,
      inquiryMessageEn: `I love the "Abstract Form Vase".`,
      createdBy: admin.id,
    },
  ]

  const productsMap: Record<string, any> = {}

  for (const product of sampleProducts) {
    const p = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
    productsMap[p.slug] = p
  }

  if (productsMap['binh-gom-trang-lieng'] && productsMap['binh-hoa-abstract']) {
    await prisma.product.update({
      where: { id: productsMap['binh-gom-trang-lieng'].id },
      data: {
        relatedProducts: {
          connect: [{ id: productsMap['binh-hoa-abstract'].id }],
        },
      },
    })
  }

  const banners = [
    {
      titleVi: 'Vẻ đẹp trong sự tĩnh lặng',
      titleEn: 'Beauty in Stillness',
      subtitleVi: 'Gốm sứ thủ công từ Việt Nam',
      subtitleEn: 'Handcrafted ceramics from Vietnam',
      imageUrl:
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop',
      link: '/shop',
      order: 1,
      isActive: true,
      textPosition: 'center',
      textColor: '#FFFFFF',
      createdBy: admin.id,
    },
    {
      titleVi: 'Bộ Sưu Tập Mới',
      titleEn: 'New Collection',
      subtitleVi: 'Khám phá những mẫu thiết kế độc đáo',
      subtitleEn: 'Discover unique designs',
      imageUrl:
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=2070&auto=format&fit=crop',
      link: '/shop?sort=newest',
      order: 2,
      isActive: true,
      textPosition: 'left',
      textColor: '#FFFFFF',
      createdBy: admin.id,
    },
  ]

  const prismaAny = prisma as any

  for (const banner of banners) {
    const existing = await prismaAny.banner.findFirst({
      where: { imageUrl: banner.imageUrl },
    })

    if (!existing) {
      await prismaAny.banner.create({
        data: banner,
      })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seeding error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
