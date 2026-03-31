// frontend/lib/server-utils.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface BrandingData {
  brandNameVi?: string
  brandNameEn?: string
  brandTaglineVi?: string
  brandTaglineEn?: string
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
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
  }
}

export async function fetchBrandingNoStore(): Promise<BrandingData | null> {
  try {
    const res = await fetch(`${API_URL}/settings/branding`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
  }
}
