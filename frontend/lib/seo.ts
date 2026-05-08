const DEFAULT_CANONICAL_BASE_URL = 'https://www.uomarchive.com'

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function getCanonicalBaseUrl(rawUrl?: string): string {
  const raw = rawUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_CANONICAL_BASE_URL

  try {
    const url = new URL(raw)

    // Keep local development URLs untouched.
    if (!isLocalHost(url.hostname)) {
      url.protocol = 'https:'
      if (url.hostname === 'uomarchive.com') {
        url.hostname = 'www.uomarchive.com'
      }
    }

    url.hash = ''
    url.search = ''

    const canonical = url.toString().replace(/\/$/, '')
    return canonical || DEFAULT_CANONICAL_BASE_URL
  } catch {
    return DEFAULT_CANONICAL_BASE_URL
  }
}

export function getCanonicalHost(rawUrl?: string): string {
  try {
    return new URL(getCanonicalBaseUrl(rawUrl)).host
  } catch {
    return 'www.uomarchive.com'
  }
}
