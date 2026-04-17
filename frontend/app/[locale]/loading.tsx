import { LoadingScreen } from '@/components/ui/loading-screen'
import { fetchBrandingNoStore } from '@/lib/server-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Loading() {
  const branding = await fetchBrandingNoStore()
  return <LoadingScreen text={branding?.loadingText} fullscreen />
}
