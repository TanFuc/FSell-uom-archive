import { type Metadata } from 'next'
import { NetworkErrorState } from '@/components/ui/network-error-state'

interface NetworkErrorPageProps {
  params: {
    locale: string
  }
}

export function generateMetadata({ params }: NetworkErrorPageProps): Metadata {
  const isVietnamese = params.locale === 'vi'

  return {
    title: isVietnamese ? 'Kết nối bị gián đoạn | ƯƠM' : 'Connection interrupted | UOM',
    description: isVietnamese
      ? 'Trang thông báo khi kết nối tới ƯƠM bị gián đoạn.'
      : 'Status page shown when the connection to UOM is interrupted.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function NetworkErrorPage() {
  return <NetworkErrorState />
}
