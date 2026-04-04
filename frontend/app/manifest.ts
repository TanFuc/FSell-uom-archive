import { type MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(/\/$/, '')

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UOM. Archive',
    short_name: 'UOM.',
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
