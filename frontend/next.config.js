const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const apiUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
const apiUrlObj = new URL(apiUrl)
const apiProtocol = apiUrlObj.protocol.replace(':', '')
const apiPort = apiUrlObj.port

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon.svg',
        permanent: false,
      },
      // 1. Non-www → www (canonical domain)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'uomarchive.com' }],
        destination: 'https://www.uomarchive.com/:path*',
        permanent: true,
      },
      // 2. Old root → /vi (default locale for SEO authority transfer)
      // Root URL that hits before intl middleware picks it up
      {
        source: '/',
        missing: [{ type: 'header', key: 'x-locale-redirect-done' }],
        destination: '/vi',
        permanent: true, // 301 for permanent SEO authority transfer
      },
      // 3. Old non-locale shop URLs → /vi/shop (most critical for SEO recovery)
      {
        source: '/shop/:slug*',
        destination: '/vi/shop/:slug*',
        permanent: true,
      },
      // 4. Old non-locale journal/blog URLs → /vi/journal
      {
        source: '/journal/:slug*',
        destination: '/vi/journal/:slug*',
        permanent: true,
      },
      {
        source: '/blog/:slug*',
        destination: '/vi/journal/:slug*',
        permanent: true,
      },
      // 5. Old non-locale static pages
      {
        source: '/about',
        destination: '/vi/about',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/vi/about',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [96, 256, 384],
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrlObj.hostname,
        port: apiPort,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'images.uomarchive.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  poweredByHeader: false,
  compress: false,
  reactStrictMode: true,
}

module.exports = withNextIntl(nextConfig)
