#!/usr/bin/env node

// Smoke test for the unified single sitemap.xml (not sitemap index).
// Validates: XML declaration, urlset element, all locs are valid URLs,
// all locs are on the expected host, no duplicate locs.

const DEFAULT_BASE_URL = 'https://www.uomarchive.com'

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function extractLocValues(xml) {
  const matches = xml.match(/<loc>([\s\S]*?)<\/loc>/g) || []
  return matches
    .map((match) => match.replace('<loc>', '').replace('</loc>', '').trim())
    .map((value) => decodeXml(value))
    .filter((value) => value.length > 0)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function fetchXml(url) {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`)
  }
  const xml = await response.text()
  assert(xml.startsWith('<?xml'), `Missing XML declaration for ${url}`)
  return xml
}

async function run() {
  const argBaseUrl = process.argv[2]
  const envBaseUrl = process.env.NEXT_PUBLIC_APP_URL
  const baseUrl = (argBaseUrl || envBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  const baseParsed = new URL(baseUrl)

  const sitemapUrl = `${baseUrl}/sitemap.xml`
  const xml = await fetchXml(sitemapUrl)

  // Must be a urlset, NOT a sitemapindex
  assert(
    xml.includes('<urlset'),
    'sitemap.xml must be a urlset (single sitemap), not a sitemapindex',
  )
  assert(
    !xml.includes('<sitemapindex'),
    'sitemap.xml must NOT be a sitemapindex — use a single unified sitemap',
  )

  const locs = extractLocValues(xml)
  assert(locs.length > 0, 'sitemap.xml has no <loc> URLs')

  const isLocalBase = ['localhost', '127.0.0.1', '::1'].includes(baseParsed.hostname)
  const duplicates = new Set()
  const seen = new Set()

  // For very large sitemaps, we could sample. For this size, we check all.
  process.stdout.write(`[smoke:sitemap] Deep checking ${locs.length} URLs...\n`)

  for (const loc of locs) {
    // 1. Structural/Host Checks
    const parsed = new URL(loc)
    if (!isLocalBase) {
      assert(
        parsed.host === baseParsed.host,
        `Wrong host in sitemap: ${loc} (expected ${baseParsed.host})`,
      )
    }
    assert(parsed.protocol === 'https:', `Non-HTTPS URL in sitemap: ${loc}`)

    const normalized = loc.toLowerCase().replace(/\/$/, '')
    if (seen.has(normalized)) duplicates.add(loc)
    seen.add(normalized)

    // 2. SEO Health Checks (Live fetch)
    const res = await fetch(loc, { method: 'GET', redirect: 'manual' })

    // Check for redirects (sitemap URLs must be canonical/indexable, not redirects)
    assert(
      res.status === 200,
      `URL in sitemap must return 200 OK directly, but ${loc} returned ${res.status}${
        res.status === 301 || res.status === 302 ? ' (Redirect)' : ''
      }`,
    )

    // Check for noindex and canonical in body
    const html = await res.text()
    assert(
      !html.includes('noindex'),
      `URL in sitemap is marked as noindex: ${loc}`,
    )

    // Basic canonical check (if canonical exists, it should match loc)
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    if (canonicalMatch) {
      const canonicalHref = canonicalMatch[1]
      // We allow protocol relative or absolute, but must match
      assert(
        canonicalHref.includes(parsed.pathname),
        `Canonical mismatch for ${loc}: found ${canonicalHref}`,
      )
    }
  }

  if (duplicates.size > 0) {
    process.stderr.write(`[smoke:sitemap] WARNING: ${duplicates.size} duplicate URLs found.\n`)
  }

  process.stdout.write(
    `[smoke:sitemap] OK. url=${sitemapUrl}, totalURLs=${locs.length}, all healthy (200 OK, indexable)\n`,
  )
}

run().catch((error) => {
  process.stderr.write(`[smoke:sitemap] Failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
