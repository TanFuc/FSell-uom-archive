#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.uomarchive.com'
const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_RETRIES = 3

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

function countUrlEntries(xml) {
  return (xml.match(/<url>/g) || []).length
}

function toTargetUrl(loc, baseUrl) {
  const parsed = new URL(loc)
  const baseParsed = new URL(baseUrl)
  const isLocalBase = ['localhost', '127.0.0.1', '::1'].includes(baseParsed.hostname)

  if (parsed.host === baseParsed.host || !isLocalBase) {
    return loc
  }

  return `${baseParsed.protocol}//${baseParsed.host}${parsed.pathname}${parsed.search}`
}

async function fetchXml(url, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, timeoutMs)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${url} (${response.status})`)
      }

      const xml = await response.text()
      if (!xml.startsWith('<?xml')) {
        throw new Error(`Missing XML declaration for ${url}`)
      }

      return xml
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

function printResultLine(name, ok, details) {
  const mark = ok ? 'PASS' : 'FAIL'
  process.stdout.write(`- [${mark}] ${name}: ${details}\n`)
}

async function run() {
  const argBaseUrl = process.argv[2]
  const minProductUrls = parsePositiveInt(process.argv[3], 1)
  const minJournalUrls = parsePositiveInt(process.argv[4], 1)
  const baseUrl = (argBaseUrl || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    '',
  )

  const indexUrl = `${baseUrl}/sitemap.xml`
  const indexXml = await fetchXml(indexUrl)
  const allSitemapLocs = extractLocValues(indexXml)

  const productSitemaps = allSitemapLocs.filter((loc) => /\/sitemaps\/products-\d+\.xml$/i.test(loc))
  const journalSitemaps = allSitemapLocs.filter((loc) => /\/sitemaps\/journal-\d+\.xml$/i.test(loc))

  let productUrlCount = 0
  let journalUrlCount = 0
  let productViCount = 0
  let productEnCount = 0
  let journalViCount = 0
  let journalEnCount = 0

  for (const loc of productSitemaps) {
    const targetUrl = toTargetUrl(loc, baseUrl)
    const xml = await fetchXml(targetUrl)
    const locs = extractLocValues(xml)
    productUrlCount += countUrlEntries(xml)
    productViCount += locs.filter((url) => /\/vi\/shop\//i.test(url)).length
    productEnCount += locs.filter((url) => /\/en\/shop\//i.test(url)).length
  }

  for (const loc of journalSitemaps) {
    const targetUrl = toTargetUrl(loc, baseUrl)
    const xml = await fetchXml(targetUrl)
    const locs = extractLocValues(xml)
    journalUrlCount += countUrlEntries(xml)
    journalViCount += locs.filter((url) => /\/vi\/journal\//i.test(url)).length
    journalEnCount += locs.filter((url) => /\/en\/journal\//i.test(url)).length
  }

  const checks = [
    {
      name: 'Sitemap index reachable',
      ok: true,
      details: `${indexUrl}`,
    },
    {
      name: 'Products child sitemap exists',
      ok: productSitemaps.length > 0,
      details: `count=${productSitemaps.length}`,
    },
    {
      name: 'Journal child sitemap exists',
      ok: journalSitemaps.length > 0,
      details: `count=${journalSitemaps.length}`,
    },
    {
      name: 'Product detail URL count threshold',
      ok: productUrlCount >= minProductUrls,
      details: `found=${productUrlCount}, min=${minProductUrls}`,
    },
    {
      name: 'Product locale coverage (vi/en)',
      ok: minProductUrls === 0 || (productViCount > 0 && productEnCount > 0),
      details: `vi=${productViCount}, en=${productEnCount}, minTotal=${minProductUrls}`,
    },
    {
      name: 'Product locale parity (vi=en)',
      ok: productViCount === productEnCount,
      details: `vi=${productViCount}, en=${productEnCount}`,
    },
    {
      name: 'Journal detail URL count threshold',
      ok: journalUrlCount >= minJournalUrls,
      details: `found=${journalUrlCount}, min=${minJournalUrls}`,
    },
    {
      name: 'Journal locale coverage (vi/en)',
      ok: minJournalUrls === 0 || (journalViCount > 0 && journalEnCount > 0),
      details: `vi=${journalViCount}, en=${journalEnCount}, minTotal=${minJournalUrls}`,
    },
    {
      name: 'Journal locale parity (vi=en)',
      ok: journalViCount === journalEnCount,
      details: `vi=${journalViCount}, en=${journalEnCount}`,
    },
  ]

  process.stdout.write('Post-deploy sitemap checklist\n')
  process.stdout.write(`Base URL: ${baseUrl}\n`)
  process.stdout.write(`Discovered child sitemaps: total=${allSitemapLocs.length}\n`)

  for (const check of checks) {
    printResultLine(check.name, check.ok, check.details)
  }

  const failed = checks.filter((check) => !check.ok)

  process.stdout.write(`Summary: ${failed.length === 0 ? 'PASS' : 'FAIL'}\n`)
  process.stdout.write(
    `Counts: products=${productUrlCount} (vi=${productViCount}, en=${productEnCount}) across ${productSitemaps.length} sitemap(s), journal=${journalUrlCount} (vi=${journalViCount}, en=${journalEnCount}) across ${journalSitemaps.length} sitemap(s)\n`,
  )

  if (failed.length > 0) {
    process.exit(1)
  }
}

run().catch((error) => {
  process.stderr.write(
    `[check:sitemap:postdeploy] FAIL: ${error instanceof Error ? error.message : String(error)}\n`,
  )
  process.exit(1)
})
