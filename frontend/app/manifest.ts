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
    background_color: '#F9F7F1',
    theme_color: '#4A4238',
    orientation: 'portrait',
    icons: [
      {
        src: `${BASE_URL}/assets/logo-remove.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `${BASE_URL}/assets/logo-remove.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
