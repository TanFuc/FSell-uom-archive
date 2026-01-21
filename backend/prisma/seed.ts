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
    { key: 'brand.name.vi', value: 'Ươm Archive' },
    { key: 'brand.name.en', value: 'Ươm Archive' },
    { key: 'footer.text.vi', value: '© 2026 Ươm Archive. Tất cả quyền được bảo lưu.' },
    { key: 'footer.text.en', value: '© 2026 Ươm Archive. All rights reserved.' },
    { key: 'hero.title.vi', value: 'Vẻ đẹp trong sự tĩnh lặng' },
    { key: 'hero.title.en', value: 'Beauty in Stillness' },
    { key: 'hero.subtitle.vi', value: 'Gốm sứ thủ công từ Việt Nam' },
    { key: 'hero.subtitle.en', value: 'Handcrafted ceramics from Vietnam' },
    { key: 'inquiry.button.vi', value: 'Hỏi sản phẩm' },
    { key: 'inquiry.button.en', value: 'Inquire' },
  ]

  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
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

  // Create sample products with inquiry messages
  const sampleProducts = [
    {
      slug: 'binh-gom-trang-01',
      nameVi: 'Bình Gốm Trắng',
      nameEn: 'White Ceramic Vase',
      descriptionVi:
        'Bình gốm trắng thủ công với thiết kế tối giản, được làm từ đất sét cao cấp và nung ở nhiệt độ cao. Mỗi sản phẩm là một tác phẩm độc nhất.',
      descriptionEn:
        'Handcrafted white ceramic vase with minimalist design, made from premium clay and fired at high temperature. Each piece is unique.',
      priceVND: 1200000,
      images: ['/uploads/products/sample-vase-1.webp'],
      material: 'Gốm sứ cao cấp / Premium ceramic',
      dimensions: '15cm x 15cm x 30cm',
      stock: 10,
      isActive: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến sản phẩm "Bình Gốm Trắng".

Thông tin sản phẩm:
- Giá: 1,200,000₫
- Chất liệu: Gốm sứ cao cấp
- Kích thước: 15cm x 15cm x 30cm

Bạn có thể cho tôi biết thêm chi tiết không?`,
      inquiryMessageEn: `Hello! I'm interested in the "White Ceramic Vase".

Product details:
- Price: 1,200,000₫ (~$48)
- Material: Premium ceramic
- Dimensions: 15cm x 15cm x 30cm

Could you provide more information?`,
      createdBy: admin.id,
    },
    {
      slug: 'chen-dat-nung',
      nameVi: 'Chén Đất Nung',
      nameEn: 'Terracotta Bowl',
      descriptionVi:
        'Chén đất nung với màu nâu đất tự nhiên, lý tưởng cho việc trưng bày hoặc sử dụng hàng ngày. Được làm thủ công bởi nghệ nhân địa phương.',
      descriptionEn:
        'Terracotta bowl with natural earthy brown color, ideal for display or daily use. Handmade by local artisans.',
      priceVND: 450000,
      images: ['/uploads/products/sample-bowl-1.webp'],
      material: 'Đất nung / Terracotta',
      dimensions: '20cm x 20cm x 8cm',
      stock: 25,
      isActive: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến sản phẩm "Chén Đất Nung".

Thông tin sản phẩm:
- Giá: 450,000₫
- Chất liệu: Đất nung
- Kích thước: 20cm x 20cm x 8cm

Bạn có thể cho tôi biết thêm chi tiết không?`,
      inquiryMessageEn: `Hello! I'm interested in the "Terracotta Bowl".

Product details:
- Price: 450,000₫ (~$18)
- Material: Terracotta
- Dimensions: 20cm x 20cm x 8cm

Could you provide more information?`,
      createdBy: admin.id,
    },
    {
      slug: 'lo-hoa-nho',
      nameVi: 'Lọ Hoa Nhỏ',
      nameEn: 'Small Flower Vase',
      descriptionVi:
        'Lọ hoa nhỏ xinh với men màu xanh xám nhẹ nhàng, phù hợp để cắm một cành hoa đơn giản hoặc trang trí bàn làm việc.',
      descriptionEn:
        'Cute small flower vase with soft blue-grey glaze, perfect for a single flower stem or desk decoration.',
      priceVND: 680000,
      images: ['/uploads/products/sample-vase-2.webp'],
      material: 'Gốm men / Glazed ceramic',
      dimensions: '8cm x 8cm x 15cm',
      stock: 15,
      isActive: true,
      inquiryEnabled: true,
      inquiryMessageVi: `Xin chào! Tôi quan tâm đến sản phẩm "Lọ Hoa Nhỏ".

Thông tin sản phẩm:
- Giá: 680,000₫
- Chất liệu: Gốm men
- Kích thước: 8cm x 8cm x 15cm

Bạn có thể cho tôi biết thêm chi tiết không?`,
      inquiryMessageEn: `Hello! I'm interested in the "Small Flower Vase".

Product details:
- Price: 680,000₫ (~$27)
- Material: Glazed ceramic
- Dimensions: 8cm x 8cm x 15cm

Could you provide more information?`,
      createdBy: admin.id,
    },
  ]

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log('Sample products created with inquiry messages')

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
