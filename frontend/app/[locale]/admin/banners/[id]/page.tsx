'use client'

import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { type Banner } from '@/lib/types'
import BannerForm from '../_components/banner-form'

export default function EditBannerPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [banner, setBanner] = useState<Banner | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await api.getBannerById(id)
        setBanner(data)
      } catch (error) {
        console.error('Failed to fetch banner:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBanner()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Banner not found</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go back
        </button>
      </div>
    )
  }

  return <BannerForm initialData={banner} />
}
