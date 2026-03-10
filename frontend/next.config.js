const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const apiUrlObj = new URL(apiUrl)
const apiProtocol = apiUrlObj.protocol.replace(':', '')
const apiPort = apiUrlObj.port

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
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
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
}

module.exports = withNextIntl(nextConfig)
