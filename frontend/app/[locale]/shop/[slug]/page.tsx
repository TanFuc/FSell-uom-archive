import { type Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import ProductClient from './product-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchBranding() {
  try {
    const res = await fetch(`${API_URL}/settings/branding`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale()
  const [product, branding] = await Promise.all([fetchProduct(params.slug), fetchBranding()])

  if (!product) return { title: 'Product Not Found' }

  const isVi = locale === 'vi'
  const brandName = isVi ? (branding?.brandNameVi ?? 'Æ¯Æ M. Archive') : (branding?.brandNameEn ?? 'Æ¯Æ M. Archive')
  const name = isVi ? product.nameVi : product.nameEn
  const rawDescription = isVi
    ? (product.shortDescriptionVi || product.descriptionVi || '')
    : (product.shortDescriptionEn || product.descriptionEn || '')
  const description = rawDescription.replace(/<[^>]*>/g, '').slice(0, 160) || undefined
  const firstImage = product.images?.[0]

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | ${brandName}`,
      description,
      type: 'website',
      images: firstImage ? [{ url: firstImage, width: 1200, height: 1600, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${brandName}`,
      description,
      images: firstImage ? [firstImage] : undefined,
    },
    alternates: {
      canonical: `/${locale}/shop/${params.slug}`,
      languages: {
        vi: `/vi/shop/${params.slug}`,
        en: `/en/shop/${params.slug}`,
      },
    },
  }
}

export default function ProductPage({ params }: Props) {
  return <ProductClient params={params} />
}
