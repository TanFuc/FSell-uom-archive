import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
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

  console.log(`Admin user created: ${admin.email}`)

  // Create manager user for testing
  const managerPasswordHash = await bcrypt.hash('manager123', 10)

  const manager = await prisma.user.upsert({
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

  console.log(`Manager user created: ${manager.email}`)

  // Create default theme settings
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

  console.log('Theme settings created')

  // Create social settings for inquiry feature
  await prisma.socialSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      facebookPageUrl: 'https://m.me/uomarchive',
      instagramUsername: 'uomarchive',
    },
  })

  console.log('Social settings created (for inquiry feature)')

  // Create default site content
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
    { key: 'hero.image.vi', value: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop' },
    { key: 'hero.image.en', value: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop' }
  ]

  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    })
  }

  console.log('Site content created')

  // Create exchange rate
  await prisma.siteSettings.upsert({
    where: { key: 'exchange_rate' },
    update: {},
    create: { key: 'exchange_rate', value: '25000' },
  })

  console.log('Exchange rate created')

  // Create sample products with inquiry messages and VERIFIED REAL aesthetic images
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
      images: ['https://images.unsplash.com/photo-1581783342308-f792ca11df53?q=80&w=1000&auto=format&fit=crop'],
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
        'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop'
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
      images: ['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop'],
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
      images: ['https://images.unsplash.com/photo-1581783342308-f792ca11df53?q=80&w=1000&auto=format&fit=crop'],
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
      images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=1000&auto=format&fit=crop'],
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
      images: ['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop'],
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
      images: ['https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=1000&auto=format&fit=crop'],
      material: 'Đất cao lanh / Kaolin',
      dimensions: '30cm x 18cm',
      stock: 4,
      isActive: true,
      isFeatured: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Tôi rất thích mẫu "Bình Hoa Abstract".`,
      inquiryMessageEn: `I love the "Abstract Form Vase".`,
      createdBy: admin.id,
    }
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

  // Link related products (Example: Lieng Vase relates to Abstract Vase)
  if (productsMap['binh-gom-trang-lieng'] && productsMap['binh-hoa-abstract']) {
    console.log('Linking related products...')
    await prisma.product.update({
      where: { id: productsMap['binh-gom-trang-lieng'].id },
      data: {
        relatedProducts: {
          connect: [{ id: productsMap['binh-hoa-abstract'].id }]
        }
      }
    })
  }

  console.log('Sample products created with inquiry messages')

  // Create Banners
  console.log('Creating banners...')
  const banners = [
    {
      titleVi: 'Vẻ đẹp trong sự tĩnh lặng',
      titleEn: 'Beauty in Stillness',
      subtitleVi: 'Gốm sứ thủ công từ Việt Nam',
      subtitleEn: 'Handcrafted ceramics from Vietnam',
      imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop',
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
      imageUrl: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?q=80&w=2070&auto=format&fit=crop',
      link: '/shop?sort=newest',
      order: 2,
      isActive: true,
      textPosition: 'left',
      textColor: '#FFFFFF',
      createdBy: admin.id,
    }
  ]

  // Use any cast if Banner type is not yet generated in client
  const prismaAny = prisma as any

  for (const banner of banners) {
    // Check if banner exists by image url to avoid dups in this simple seed
    const existing = await prismaAny.banner.findFirst({
      where: { imageUrl: banner.imageUrl }
    })
    
    if (!existing) {
      await prismaAny.banner.create({
        data: banner
      })
    }
  }
  console.log('Banners created')

  console.log('\n========================================')
  console.log('Seeding completed!')
  console.log('========================================')
  console.log('\nAdmin credentials:')
  console.log('  Email: admin@uomarchive.com')
  console.log('  Password: admin123')
  console.log('\nManager credentials:')
  console.log('  Email: manager@uomarchive.com')
  console.log('  Password: manager123')
  console.log('\nFeatures implemented:')
  console.log('  - Inquiry Feature (replaces Orders)')
  console.log('  - Soft Delete with Audit Trail')
  console.log('  - Role-based Access (ADMIN/MANAGER)')
  console.log('  - Bulk Operations')
  console.log('  - Product Duplication')
  console.log('  - Redis Caching')
  console.log('========================================\n')
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
