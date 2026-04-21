const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888/api'
const apiUrlObj = new URL(apiUrl)
const apiProtocol = apiUrlObj.protocol.replace(':', '')
const apiPort = apiUrlObj.port

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'uomarchive.com' }],
        destination: 'https://www.uomarchive.com/:path*',
        permanent: true,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiUrlObj.hostname,
        port: apiPort,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
}

module.exports = withNextIntl(nextConfig)
