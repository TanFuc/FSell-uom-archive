const BLOCKED_AI_BOTS = [
  'Amazonbot',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'ClaudeBot',
  'GPTBot',
  'Google-Extended',
]

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.uomarchive.com').replace(/\/$/, '')
}

export const revalidate = 3600

export function GET(): Response {
  const baseUrl = getBaseUrl()

  const lines = [
    '# Cloudflare Managed signals',
    'User-agent: *',
    'Content-Signal: search=yes,ai-train=no',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /vi/admin/',
    'Disallow: /en/admin/',
    '',
    '# Block AI crawling bots',
    ...BLOCKED_AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Disallow: /', '']),
    `Host: ${baseUrl}`,
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
