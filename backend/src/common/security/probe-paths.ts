import { Request } from 'express'

const HARD_BLOCK_PATTERNS: RegExp[] = [
  /\/\.env(?:\.|$)/i,
  /\/\.git(?:\/|$)/i,
  /\/id_rsa(?:\.|$)/i,
  /\/composer\.(?:json|lock)$/i,
  /\/phpinfo\.php$/i,
  /\/info\.php$/i,
]

const PROBE_PATTERNS: RegExp[] = [
  /\/(?:api\/)?env$/i,
  /\/(?:api\/)?heapdump$/i,
  /\/(?:api\/)?configprops$/i,
  /\/wp-admin(?:\/|$)/i,
  /\/wp-login\.php$/i,
  /\/wordpress(?:\/|$)/i,
  /\/xmlrpc\.php$/i,
  /\/boaform\//i,
  /\/cgi-bin\//i,
  /\/\.well-known\/(?:acme-challenge|pki-validation)\//i,
  /\/server-status$/i,
  /\/actuator(?:\/|$)/i,
  /\/jmx-console(?:\/|$)/i,
  /\/HNAP1$/i,
  /\/vendor\/phpunit\//i,
  /\/autodiscover\/autodiscover\.xml$/i,
  /\/\.aws(?:\/|$)/i,
  /\/\.svn(?:\/|$)/i,
  /\/\.DS_Store$/i,
  /\/(?:api\/)?(?:v\d+\/)?(?:aws|config|credentials|keys|secrets|settings|appsettings)\.json$/i,
  /\/(?:api\/)?application\.properties$/i,
  /\.(?:php|aspx?|jsp|cgi|env|bak|old|ini|sql|yml|yaml)(?:$|\?)/i,
]

const WINDOW_MS = 60_000
const MAX_PROBE_REQUESTS_PER_WINDOW = 25
const probeCounter = new Map<string, { count: number; resetAt: number }>()

function normalizePath(urlOrPath: string): string {
  const [pathname] = (urlOrPath ?? '/').split('?')
  return (pathname ?? '/').toLowerCase()
}

export function extractRequestPath(request: Request): string {
  return normalizePath(request.originalUrl ?? request.url ?? request.path ?? '/')
}

export function isHardBlockedProbePath(path: string): boolean {
  const normalized = normalizePath(path)
  return HARD_BLOCK_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function isProbePath(path: string): boolean {
  const normalized = normalizePath(path)

  if (isHardBlockedProbePath(normalized)) {
    return true
  }

  return PROBE_PATTERNS.some((pattern) => pattern.test(normalized))
}

function getRequesterIp(request: Request): string {
  const xForwardedFor = request.headers['x-forwarded-for']
  if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
    return xForwardedFor.split(',')[0].trim()
  }

  return request.ip ?? request.socket.remoteAddress ?? 'unknown-ip'
}

export function isProbeRateLimited(request: Request): boolean {
  const ip = getRequesterIp(request)
  const now = Date.now()
  const current = probeCounter.get(ip)

  if (!current || now > current.resetAt) {
    probeCounter.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  if (current.count > MAX_PROBE_REQUESTS_PER_WINDOW) {
    return true
  }

  probeCounter.set(ip, current)
  return false
}
