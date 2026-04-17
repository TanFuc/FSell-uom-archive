#!/usr/bin/env node

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
  const response = await fetch(url)
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

  const indexUrl = `${baseUrl}/sitemap.xml`
  const indexXml = await fetchXml(indexUrl)

  assert(indexXml.includes('<sitemapindex'), 'sitemap.xml must be a sitemap index')

  const sitemapLocs = extractLocValues(indexXml)
  assert(sitemapLocs.length > 0, 'sitemap index has no child sitemap URLs')

  for (const loc of sitemapLocs) {
    const parsed = new URL(loc)
    const baseParsed = new URL(baseUrl)

    assert(
      parsed.host === baseParsed.host,
      `Unexpected sitemap host ${parsed.host} (expected ${baseParsed.host})`,
    )

    const sitemapXml = await fetchXml(loc)
    assert(sitemapXml.includes('<urlset'), `Child sitemap is not a urlset: ${loc}`)

    const urlLocs = extractLocValues(sitemapXml)
    for (const urlLoc of urlLocs) {
      new URL(urlLoc)
    }
  }

  process.stdout.write(
    `[smoke:sitemap] OK. index=${indexUrl}, childSitemaps=${sitemapLocs.length}\n`,
  )
}

run().catch((error) => {
  process.stderr.write(`[smoke:sitemap] Failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
