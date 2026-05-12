import { type Metadata } from 'next'
import PageNewClient from './page-new-client'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = params.locale

  return {
    title: locale === 'vi' ? 'Trang thử nghiệm' : 'Preview Page',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}`,
    },
  }
}

export default function PageNew() {
  return <PageNewClient />
}
