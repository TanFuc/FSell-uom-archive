// frontend/lib/server-utils.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface BrandingData {
  brandNameVi?: string
  brandNameEn?: string
  siteTitleVi?: string
  siteTitleEn?: string
  siteDescriptionVi?: string
  siteDescriptionEn?: string
  logoUrl?: string
  loadingText?: string
}

export async function fetchBranding(): Promise<BrandingData | null> {
  try {
    const res = await fetch(`${API_URL}/settings/branding`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
