import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const nextDir = path.join(root, '.next')
const standaloneDir = path.join(nextDir, 'standalone')
const serverSrc = path.join(nextDir, 'server')
const serverDest = path.join(standaloneDir, '.next', 'server')
const staticSrc = path.join(nextDir, 'static')
const staticDest = path.join(standaloneDir, '.next', 'static')
const publicSrc = path.join(root, 'public')
const publicDest = path.join(standaloneDir, 'public')
const serverEntry = path.join(standaloneDir, 'server.js')
const requiredServerFiles = [
  ['pages', '_error.js'],
  ['pages', '_error.js.nft.json'],
  ['app', '[locale]', 'shop', '[slug]', 'page.js'],
  ['app', '[locale]', 'shop', '[slug]', 'page.js.nft.json'],
]

function copyDirIfExists(src, dest) {
  if (!existsSync(src)) {
    return
  }

  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true })
  }

  mkdirSync(path.dirname(dest), { recursive: true })
  cpSync(src, dest, { recursive: true })
}

function ensureServerFile(relativeParts) {
  const src = path.join(serverSrc, ...relativeParts)
  const dest = path.join(serverDest, ...relativeParts)

  if (existsSync(dest)) {
    return true
  }

  if (!existsSync(src)) {
    return false
  }

  mkdirSync(path.dirname(dest), { recursive: true })
  cpSync(src, dest)
  return true
}

if (!existsSync(serverEntry)) {
  console.error('Missing standalone build output. Run "npm run build" first.')
  process.exit(1)
}

if (!existsSync(serverSrc) || !existsSync(staticSrc)) {
  console.error(
    'Incomplete Next.js build output. Missing .next/server or .next/static. Run "npm run build" again before starting standalone.',
  )
  process.exit(1)
}

copyDirIfExists(staticSrc, staticDest)
copyDirIfExists(publicSrc, publicDest)
copyDirIfExists(serverSrc, serverDest)

const missingRequired = requiredServerFiles.filter((parts) => !ensureServerFile(parts))
if (missingRequired.length > 0) {
  console.error(
    `Missing required standalone server files:\n${missingRequired
      .map((parts) => `- .next/server/${parts.join('/')}`)
      .join('\n')}`,
  )
  process.exit(1)
}
