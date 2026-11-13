import { type MetadataRoute } from 'next'
import { getCanonicalBaseUrl } from '@/lib/seo'

const BASE_URL = getCanonicalBaseUrl()

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ƯƠM.',
    short_name: 'ƯƠM.',
    description: 'Vietnamese handcrafted ceramics curated with care.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    orientation: 'portrait',
    icons: [
      {
        src: `${BASE_URL}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${BASE_URL}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
