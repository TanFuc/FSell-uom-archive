import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

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
        <p>At ƯƠM., we believe timeless beauty does not come from absolute perfection, but from honesty in every fingerprint left by the making process.</p>
        <h3>Keeping the fire for quality</h3>
        <p>Firing takes hours and demands precise temperature control. A subtle shift in flame can produce a completely different glaze transition.</p>
        <blockquote>"Each firing teaches us humility in front of material."</blockquote>
        <p>When pieces leave the kiln, we inspect each one by hand: the base, rim balance, and glaze tone under natural light.</p>
      `,
      imageUrl:
        'https://images.uomarchive.com/seed/journal-hands.png',
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
        'https://images.uomarchive.com/seed/journal-glaze.png',
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
        'https://images.uomarchive.com/seed/journal-tea.png',
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
        'https://images.uomarchive.com/seed/about-story.png',
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
        'https://images.uomarchive.com/seed/product-dinner-1.png',
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
    { key: 'brand.name.vi', value: 'ƯƠM.' },
    { key: 'brand.name.en', value: 'ƯƠM.' },
    { key: 'footer.text.vi', value: '© 2026 ƯƠM. Tất cả quyền được bảo lưu.' },
    { key: 'footer.text.en', value: '© 2026 ƯƠM. All rights reserved.' },
    { key: 'hero.title.vi', value: 'Vẻ đẹp trong sự tĩnh lặng' },
    { key: 'hero.title.en', value: 'Beauty in Stillness' },
    { key: 'hero.subtitle.vi', value: 'Gốm sứ thủ công từ Việt Nam' },
    { key: 'hero.subtitle.en', value: 'Handcrafted ceramics from Vietnam' },
    { key: 'inquiry.button.vi', value: 'Hỏi sản phẩm' },
    { key: 'inquiry.button.en', value: 'Inquire' },
    {
      key: 'hero.image.vi',
      value:
        'https://images.uomarchive.com/seed/hero.png',
    },
    {
      key: 'hero.image.en',
      value:
        'https://images.uomarchive.com/seed/hero.png',
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
    { key: 'site.title.vi', value: 'ƯƠM. - Gốm sứ thủ công Việt Nam' },
    { key: 'site.title.en', value: 'ƯƠM. - Handcrafted Ceramics from Vietnam' },
    {
      key: 'site.description.vi',
      value:
        'ƯƠM. tuyển chọn gốm sứ thủ công Việt Nam, lưu giữ vẻ đẹp mộc mạc, tinh tế và câu chuyện của nghệ nhân bản địa.',
    },
    {
      key: 'site.description.en',
      value:
        'Discover Vietnamese handcrafted ceramics curated for quiet beauty, refined living, and artisan stories.',
    },
    { key: 'site.logoUrl', value: '' },
    { key: 'site.loadingText', value: 'ƯƠM.' },
  ]

  for (const item of brandingDefaults) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    })
  }

  const categorySeeds = [
    {
      slug: 'binh-hoa-loc',
      nameVi: 'Bình hoa & Lọ',
      nameEn: 'Vases & Jars',
      descriptionVi: 'Bình gốm thủ công dành cho trang trí không gian sống và cắm hoa.',
      descriptionEn: 'Handcrafted ceramic vases for floral styling and interior display.',
      image:
        'https://images.uomarchive.com/seed/cat-vases.png',
      order: 1,
      isActive: true,
    },
    {
      slug: 'bo-ban-an',
      nameVi: 'Bộ bàn ăn',
      nameEn: 'Dinnerware Sets',
      descriptionVi: 'Bộ chén đĩa và phụ kiện bàn ăn mang tinh thần thủ công tối giản.',
      descriptionEn: 'Dinnerware collections crafted for everyday rituals and minimal tables.',
      image:
        'https://images.uomarchive.com/seed/cat-dinnerware.png',
      order: 2,
      isActive: true,
    },
    {
      slug: 'chen-coc-tra',
      nameVi: 'Chén & Cốc trà',
      nameEn: 'Tea Cups',
      descriptionVi: 'Chén cốc gốm cầm tay vừa vặn, men mộc, phù hợp dùng hằng ngày.',
      descriptionEn: 'Tactile handcrafted cups made for daily tea rituals.',
      image:
        'https://images.uomarchive.com/seed/cat-tea.png',
      order: 3,
      isActive: true,
    },
    {
      slug: 'dia-khay',
      nameVi: 'Đĩa & Khay',
      nameEn: 'Plates & Trays',
      descriptionVi: 'Đĩa gốm men rạn và khay phục vụ có độ hoàn thiện cao.',
      descriptionEn: 'Glazed ceramic plates and trays with balanced handcrafted finishes.',
      image:
        'https://images.uomarchive.com/seed/cat-trays.png',
      order: 4,
      isActive: true,
    },
  ]

  const categoriesMap: Record<string, { id: string }> = {}

  for (const category of categorySeeds) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameVi: category.nameVi,
        nameEn: category.nameEn,
        descriptionVi: category.descriptionVi,
        descriptionEn: category.descriptionEn,
        image: category.image,
        order: category.order,
        isActive: category.isActive,
        updatedBy: admin.id,
      },
      create: {
        ...category,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    })

    categoriesMap[saved.slug] = { id: saved.id }
  }

  // Clear existing products to ensure clean SEO data
  await prisma.product.deleteMany()

  const monochromeImages = {
    vases: [
      'https://images.uomarchive.com/seed/product-vase-1.png',
      'https://images.uomarchive.com/seed/product-vase-2.png',
      'https://images.uomarchive.com/seed/product-vase-3.png',
      'https://images.uomarchive.com/seed/product-vase-4.png',
    ],
    dinnerware: [
      'https://images.uomarchive.com/seed/product-dinner-1.png',
      'https://images.uomarchive.com/seed/product-dinner-2.png',
      'https://images.uomarchive.com/seed/product-dinner-3.png',
      'https://images.uomarchive.com/seed/product-dinner-4.png',
    ],
    tea: [
      'https://images.uomarchive.com/seed/product-tea-1.png',
      'https://images.uomarchive.com/seed/product-tea-2.png',
      'https://images.uomarchive.com/seed/product-teapot-1.png',
      'https://images.uomarchive.com/seed/product-teapot-2.png',
    ],
    trays: [
      'https://images.uomarchive.com/seed/product-plate-1.png',
      'https://images.uomarchive.com/seed/product-plate-2.png',
      'https://images.uomarchive.com/seed/product-tray-1.png',
      'https://images.uomarchive.com/seed/product-tray-2.png',
    ],
  }

  const sampleProducts = [
    {
      slug: 'binh-gom-trang-lieng',
      nameVi: 'Bình Gốm Liêng Men Ngà',
      nameEn: 'Lieng Ivory Ceramic Vase',
      shortDescriptionVi:
        'Bình gốm thủ công dáng cao, men trắng ngà mờ tối giản cho không gian sống hiện đại.',
      shortDescriptionEn:
        'A handcrafted tall ceramic vase with a minimalist matte ivory glaze for modern living spaces.',
      descriptionVi:
        '<p>Bình gốm Liêng mang vẻ đẹp tĩnh lặng và mộc mạc. Được chế tác thủ công từ đất sét trắng tinh khiết, trải qua quá trình nung ở nhiệt độ 1200°C tạo nên độ bền cao.</p><p>Lớp men ngà mờ (matte) tạo cảm giác ấm áp khi chạm vào. Dáng bình cao thanh thoát, lý tưởng để cắm các loại hoa cành khô như lau, bạch đàn, hoặc trưng bày như một tác phẩm điêu khắc độc lập trong phòng khách.</p><ul><li>Men ngà mờ, ánh sáng dịu</li><li>Phù hợp phong cách tối giản, Bắc Âu</li><li>Đề xuất phối cùng hoa khô trung tính</li></ul>',
      descriptionEn:
        '<p>The Lieng vase brings tranquility and rustic charm to any space. Handcrafted from pure white clay and fired at 1200°C for exceptional durability.</p><p>The matte ivory glaze offers a warm tactile feel. Its elegant tall silhouette is ideal for dried botanicals like pampas or eucalyptus, or standing alone as an art piece.</p><ul><li>Matte ivory glaze</li><li>Minimalist, Nordic-friendly</li><li>Styled with neutral florals</li></ul>',
      priceVND: 1850000,
      salePriceVND: 1690000,
      images: [monochromeImages.vases[0], monochromeImages.vases[1]],
      hoverImage: monochromeImages.vases[1],
      categorySlug: 'binh-hoa-loc',
      material: 'Đất sét trắng nung cao độ / High-fire white clay',
      dimensions: '18cm x 45cm',
      stock: 5,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến sản phẩm "Bình Gốm Liêng Men Ngà".\n\nGiá: 1,850,000₫\n\nBạn tư vấn thêm giúp tôi nhé.`,
      inquiryMessageEn: `Hi! I'm interested in the "Lieng Ivory Ceramic Vase".\n\nPrice: 1,850,000₫\n\nPlease provide more details.`,
    },
    {
      slug: 'binh-hoa-abstract',
      nameVi: 'Bình Hoa Gốm Điêu Khắc Abstract',
      nameEn: 'Abstract Sculptural Ceramic Vase',
      shortDescriptionVi:
        'Bình hoa nghệ thuật với đường nét bất đối xứng, kết hợp giữa gốm thủ công và điêu khắc hiện đại.',
      shortDescriptionEn:
        'Artistic vase featuring asymmetric lines, blending traditional ceramics with modern sculpture.',
      descriptionVi:
        '<p>Bình hoa Abstract phá vỡ các quy chuẩn hình học truyền thống. Mỗi chiếc bình là một độc bản với những đường cong uốn lượn ngẫu hứng được tạo hình hoàn toàn bằng tay.</p><p>Men oxit sắt tạo bề mặt loang tự nhiên, mang hơi thở thời gian. Phù hợp không gian tối giản, gallery, hoặc studio sáng tạo.</p><ul><li>Dáng điêu khắc bất đối xứng</li><li>Men loang tự nhiên</li><li>Phù hợp decor trưng bày độc bản</li></ul>',
      descriptionEn:
        '<p>The Abstract vase breaks away from traditional geometric norms. Each piece is unique with fluid, hand-molded curves.</p><p>Finished with an iron oxide glaze for a naturally weathered surface. Perfect for those seeking bold individuality in home decor.</p><ul><li>Sculptural asymmetry</li><li>Organic iron glaze</li><li>Statement decor piece</li></ul>',
      priceVND: 2100000,
      images: [monochromeImages.vases[2], monochromeImages.vases[3]],
      hoverImage: monochromeImages.vases[3],
      categorySlug: 'binh-hoa-loc',
      material: 'Đất cao lanh nguyên bản / Raw kaolin clay',
      dimensions: '30cm x 18cm',
      stock: 4,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Tôi rất thích mẫu "Bình Hoa Gốm Điêu Khắc Abstract".`,
      inquiryMessageEn: `I love the "Abstract Sculptural Ceramic Vase".`,
    },
    {
      slug: 'bo-chen-dia-moc',
      nameVi: 'Bộ Chén Đĩa Gốm Mộc Nung Củi',
      nameEn: 'Moc Wood-Fired Dinnerware Set',
      shortDescriptionVi:
        'Bộ sưu tập bàn ăn gốm mộc nung củi truyền thống, tôn vinh vẻ đẹp nguyên bản của đất và lửa.',
      shortDescriptionEn:
        'Traditional wood-fired stoneware collection, celebrating the raw beauty of earth and fire.',
      descriptionVi:
        '<p>Bộ sản phẩm bao gồm 4 chén cơm, 2 đĩa nông, 1 đĩa sâu lòng và 2 bát tô. Được nung bằng củi trong lò bầu truyền thống suốt 72 giờ liên tục.</p><p>Khói và tro củi tạo nên vệt hỏa biến độc nhất trên bề mặt gốm. Bộ sản phẩm mang lại cảm giác ấm cúng, đậm chất gia đình cho mỗi bữa cơm.</p><ul><li>Nung củi 72 giờ</li><li>Hỏa biến tự nhiên</li><li>Phù hợp bữa ăn hằng ngày</li></ul>',
      descriptionEn:
        '<p>The set includes 4 rice bowls, 2 shallow plates, 1 deep plate, and 2 large bowls. Wood-fired in a traditional kiln for 72 hours.</p><p>Natural ash and flame paths create stunning, unpredictable patterns on the surface. Brings a warm, soulful atmosphere to family dining.</p><ul><li>72-hour wood firing</li><li>Natural ash marks</li><li>Everyday-ready</li></ul>',
      priceVND: 3200000,
      salePriceVND: 2890000,
      images: [monochromeImages.dinnerware[0], monochromeImages.dinnerware[1]],
      hoverImage: monochromeImages.dinnerware[1],
      categorySlug: 'bo-ban-an',
      material: 'Gốm sành chịu nhiệt / Heat-resistant stoneware',
      dimensions: 'Đa dạng / Assorted sizes',
      stock: 3,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi muốn đặt mua "Bộ Chén Đĩa Gốm Mộc Nung Củi".`,
      inquiryMessageEn: `Hi! I'd like to order the "Moc Wood-Fired Dinnerware Set".`,
    },
    {
      slug: 'coc-uong-tra-nham',
      nameVi: 'Cốc Trà Gốm Men Nhám Không Quai',
      nameEn: 'Matte Handleless Ceramic Tea Cup',
      shortDescriptionVi:
        'Cốc trà nhỏ gọn, không quai, lớp men nhám mộc mạc mang lại trải nghiệm thưởng trà thư thái.',
      shortDescriptionEn:
        'Compact handleless tea cup with a rustic matte glaze for a mindful tea-drinking experience.',
      descriptionVi:
        '<p>Thiết kế cốc không quai tối giản theo phong cách trà đạo Á Đông. Lớp men nhám nhẹ giúp tăng độ bám khi cầm, đồng thời giữ nhiệt độ trà ổn định lâu hơn.</p><p>Dung tích vừa vặn (150ml), thích hợp cho thói quen nhâm nhi trà sáng hoặc trà chiều tĩnh tâm.</p><ul><li>Men nhám chống trơn</li><li>Dung tích 150ml</li><li>Phù hợp pha trà hằng ngày</li></ul>',
      descriptionEn:
        '<p>Minimalist handleless design inspired by Asian tea rituals. The lightly textured matte glaze provides a secure grip and retains heat effectively.</p><p>Perfect 150ml capacity, ideal for slow morning sips or calming afternoon tea sessions.</p><ul><li>Matte anti-slip glaze</li><li>150ml volume</li><li>Daily tea ritual ready</li></ul>',
      priceVND: 250000,
      images: [monochromeImages.tea[0], monochromeImages.tea[1]],
      hoverImage: monochromeImages.tea[1],
      categorySlug: 'chen-coc-tra',
      material: 'Gốm tráng men mờ / Matte glazed ceramic',
      dimensions: '8cm x 6cm',
      stock: 50,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Tư vấn giúp mình mẫu "Cốc Trà Gốm Men Nhám Không Quai" nhé.`,
      inquiryMessageEn: `Please tell me more about the "Matte Handleless Ceramic Tea Cup".`,
    },
    {
      slug: 'dia-gom-men-ran',
      nameVi: 'Đĩa Gốm Men Rạn Ngọc Bích',
      nameEn: 'Jade Green Crackle Glaze Plate',
      shortDescriptionVi:
        'Đĩa gốm trang trí và phục vụ với kỹ thuật men rạn cổ điển màu xanh ngọc bích sang trọng.',
      shortDescriptionEn:
        'Decorative serving plate featuring classic crackle glaze in a luxurious jade green tone.',
      descriptionVi:
        '<p>Kỹ thuật men rạn (Crackle glaze) là đỉnh cao của nghệ thuật gốm sứ truyền thống. Các đường rạn tự nhiên như vết nứt thời gian ẩn hiện dưới lớp men bóng.</p><p>Sản phẩm dùng để bày biện món ăn hoặc làm điểm nhấn nghệ thuật cho kệ bếp, bàn trà.</p><ul><li>Men rạn cổ điển</li><li>Hoàn thiện thủ công</li><li>Phù hợp plating tối giản</li></ul>',
      descriptionEn:
        '<p>Crackle glaze technique represents the pinnacle of traditional ceramic artistry. Natural crack lines emerge beneath the glossy finish.</p><p>A functional plate for food presentation and a refined accent for your kitchen shelf.</p><ul><li>Classic crackle glaze</li><li>Hand-finished</li><li>Minimal plating friendly</li></ul>',
      priceVND: 550000,
      images: [monochromeImages.trays[0], monochromeImages.trays[1]],
      hoverImage: monochromeImages.trays[1],
      categorySlug: 'dia-khay',
      material: 'Gốm men rạn cao cấp / Premium crackle wear',
      dimensions: 'Đường kính 26cm / 26cm diameter',
      stock: 18,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Sản phẩm "Đĩa Gốm Men Rạn Ngọc Bích" còn hàng không ạ?`,
      inquiryMessageEn: `Is the "Jade Green Crackle Glaze Plate" still in stock?`,
    },
    {
      slug: 'khay-tra-go-gom',
      nameVi: 'Khay Trà Gốm Viền Gỗ Tràm',
      nameEn: 'Ceramic Tea Tray with Acacia Wood Rim',
      shortDescriptionVi:
        'Sự kết hợp hài hòa giữa chất liệu gốm mộc và gỗ tràm tự nhiên cho bàn trà tối giản.',
      shortDescriptionEn:
        'A harmonious blend of raw ceramic and natural acacia wood for minimal tea setups.',
      descriptionVi:
        '<p>Khay trà hình chữ nhật với lòng khay bằng gốm chịu nhiệt, dễ dàng vệ sinh khi nước trà rớt ra. Viền khay làm từ gỗ tràm tự nhiên đã qua xử lý chống ẩm mốc.</p><p>Sản phẩm mang lại vẻ đẹp hiện đại nhưng vẫn giữ sự ấm áp của chất liệu tự nhiên.</p><ul><li>Viền gỗ tràm tự nhiên</li><li>Lòng khay gốm chịu nhiệt</li><li>Phù hợp decor bàn trà</li></ul>',
      descriptionEn:
        '<p>Rectangular tea tray featuring a heat-resistant ceramic base that is easy to clean. The rim is crafted from treated, moisture-resistant natural acacia wood.</p><p>Brings a contemporary look while retaining the organic warmth of natural materials.</p><ul><li>Natural acacia rim</li><li>Heat-resistant ceramic base</li><li>Minimal tea-table styling</li></ul>',
      priceVND: 850000,
      images: [monochromeImages.trays[2], monochromeImages.trays[3]],
      hoverImage: monochromeImages.trays[3],
      categorySlug: 'dia-khay',
      material: 'Gốm mộc & Gỗ tràm / Raw ceramic & Acacia wood',
      dimensions: '35cm x 20cm x 3cm',
      stock: 10,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Tư vấn giúp mình mẫu "Khay Trà Gốm Viền Gỗ Tràm" nhé.`,
      inquiryMessageEn: `Please tell me more about the "Ceramic Tea Tray with Acacia Wood Rim".`,
    },
    {
      slug: 'bo-am-tra-thien',
      nameVi: 'Bộ Ấm Trà Thiền Định Men Tro',
      nameEn: 'Thien Ash Glaze Teapot Set',
      shortDescriptionVi:
        'Bộ ấm trà phong cách tối giản với lớp men tro tự nhiên, mang lại sự bình yên trong từng tách trà.',
      shortDescriptionEn:
        'Minimalist teapot set with natural ash glaze, bringing peace to every cup.',
      descriptionVi:
        '<p>Bộ sản phẩm gồm 1 ấm trà (350ml) và 4 chén nhỏ. Men tro (Ash glaze) được chế tạo từ tro thực vật tự nhiên, tạo nên màu sắc trung tính mộc mạc.</p><p>Dáng ấm tròn đầy đặn, vòi rót êm không bị rớt nước. Thích hợp cho buổi trà đạo, đàm đạo hoặc thưởng trà một mình.</p><ul><li>Men tro tự nhiên</li><li>Vòi rót chống nhỏ giọt</li><li>Set 1 ấm + 4 chén</li></ul>',
      descriptionEn:
        '<p>Includes 1 teapot (350ml) and 4 small cups. The ash glaze, made from natural plant ash, offers soft, rustic tones.</p><p>Round, balanced pot design with a smooth, drip-free spout. Perfect for deep conversations or quiet solitary tea moments.</p><ul><li>Natural ash glaze</li><li>Drip-free spout</li><li>1 teapot + 4 cups</li></ul>',
      priceVND: 1550000,
      images: [monochromeImages.tea[2], monochromeImages.tea[3]],
      hoverImage: monochromeImages.tea[3],
      categorySlug: 'chen-coc-tra',
      material: 'Gốm nung men tro / Ash-glazed stoneware',
      dimensions: 'Ấm 350ml, Chén 50ml',
      stock: 8,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến "Bộ Ấm Trà Thiền Định Men Tro".`,
      inquiryMessageEn: `Hi! I'm interested in the "Thien Ash Glaze Teapot Set".`,
    },
    {
      slug: 'bo-bat-dia-hoa-bien',
      nameVi: 'Bộ Bát Đĩa Men Hỏa Biến Xanh Đại Dương',
      nameEn: 'Ocean Blue Reactive Glaze Dinnerware Set',
      shortDescriptionVi:
        'Bộ bát đĩa cao cấp với hiệu ứng men hỏa biến xanh đại dương sâu thẳm và huyền bí.',
      shortDescriptionEn:
        'Premium dinnerware set featuring a deep, mysterious ocean blue reactive glaze.',
      descriptionVi:
        '<p>Mỗi sản phẩm trong bộ bát đĩa này là một bức tranh đại dương thu nhỏ. Hiệu ứng hỏa biến (reactive glaze) tạo nên các vệt màu loang tự nhiên.</p><p>Bộ sản phẩm gồm 10 chi tiết, phù hợp cho những bữa tiệc gia đình hoặc làm quà tặng tân gia.</p><ul><li>Men hỏa biến thủ công</li><li>Set 10 chi tiết</li><li>Phù hợp tiệc gia đình</li></ul>',
      descriptionEn:
        '<p>Each piece in this dinnerware set is like a miniature ocean painting. The reactive glaze creates natural tonal shifts.</p><p>The 10-piece set is perfect for family gatherings or as a meaningful housewarming gift.</p><ul><li>Handmade reactive glaze</li><li>10-piece set</li><li>Gift-ready</li></ul>',
      priceVND: 4500000,
      images: [monochromeImages.dinnerware[2], monochromeImages.dinnerware[3]],
      hoverImage: monochromeImages.dinnerware[3],
      categorySlug: 'bo-ban-an',
      material: 'Gốm sứ cao cấp / Premium porcelain',
      dimensions: 'Đa dạng / Assorted sizes',
      stock: 15,
      isActive: true,
      isFeatured: false,
      inquiryEnabled: true,
      inquiryMessageVi: `Tư vấn giúp mình "Bộ Bát Đĩa Men Hỏa Biến Xanh Đại Dương" nhé.`,
      inquiryMessageEn: `Please provide details on the "Ocean Blue Reactive Glaze Dinnerware Set".`,
    },
  ]

  const productsMap: Record<string, any> = {}

  for (const productData of sampleProducts) {
    const { categorySlug, ...rest } = productData as any
    const categoryId = categorySlug ? categoriesMap[categorySlug]?.id : null

    const createData = {
      ...rest,
      categoryId,
      createdBy: admin.id,
      updatedBy: admin.id,
    }

    const updateData = {
      ...rest,
      categoryId,
      updatedBy: admin.id,
    }

    const p = await prisma.product.upsert({
      where: { slug: createData.slug },
      update: updateData,
      create: createData,
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
        'https://images.uomarchive.com/seed/banner-main.png',
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
        'https://images.uomarchive.com/seed/banner-collection.png',
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
