import { cache } from 'react'
import { BRANDING_REVALIDATE_SECONDS } from '@/lib/cache-config'

export function getServerApiUrl(): string {
  const envApiUrl =
    process.env.SERVER_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL
  if (
    process.env.NODE_ENV === 'production' &&
    (!envApiUrl || envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1'))
  ) {
    return 'https://api.uomarchive.com'
  }
  return envApiUrl || 'http://localhost:8888'
}

const API_URL = getServerApiUrl()
const BRANDING_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.BRANDING_FETCH_TIMEOUT_MS || process.env.SERVER_FETCH_TIMEOUT_MS || '1200',
  10,
)

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

function normalizeBrandingPayload(payload: unknown): BrandingData | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const root = payload as { data?: unknown }

  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as BrandingData
  }

  return root as BrandingData
}

async function fetchBrandingInternal(
  cacheMode: RequestCache | 'revalidate',
): Promise<BrandingData | null> {
  try {
    const isRevalidateMode = cacheMode === 'revalidate'
    const timeout =
      Number.isFinite(BRANDING_FETCH_TIMEOUT_MS) && BRANDING_FETCH_TIMEOUT_MS > 0
        ? BRANDING_FETCH_TIMEOUT_MS
        : 1200
    const res = await fetch(`${API_URL}/settings/branding`, {
      ...(isRevalidateMode
        ? { next: { revalidate: BRANDING_REVALIDATE_SECONDS } }
        : { cache: cacheMode }),
      signal: AbortSignal.timeout(timeout),
    })

    if (!res.ok) {
      return null
    }

    const json = (await res.json()) as unknown
    return normalizeBrandingPayload(json)
  } catch {
    return null
  }
}

export const fetchBranding = cache(async (): Promise<BrandingData | null> => {
  return fetchBrandingInternal('revalidate')
})

export async function fetchBrandingNoStore(): Promise<BrandingData | null> {
  return fetchBrandingInternal('no-store')
}

export const fetchSiteContentServer = cache(async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`${API_URL}/settings/site-content`, {
      next: { revalidate: 60, tags: ['site-content'] },
      signal: AbortSignal.timeout(1800),
    })
    if (!response.ok) return {}
    const payload = await response.json()
    const content = payload?.data && typeof payload.data === 'object' ? payload.data : payload
    return content && typeof content === 'object' ? content : {}
  } catch { return {} }
})
