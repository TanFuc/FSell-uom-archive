#!/usr/bin/env node
import { createReadStream, existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const defaultAssetsDir = join(__dirname, '..', '..', 'release', 'seed-assets')
const assetsDir = process.argv[2] || defaultAssetsDir

const requiredEnv = ['R2_ENDPOINT', 'R2_KEY', 'R2_SECRET', 'R2_BUCKET']
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  console.error(`Missing required env: ${missingEnv.join(', ')}`)
  process.exit(1)
}

if (!existsSync(assetsDir)) {
  console.error(`Seed assets directory does not exist: ${assetsDir}`)
  process.exit(1)
}

const publicBaseUrl = (
  process.env.IMAGE_BASE_URL ||
  process.env.R2_PUBLIC_BASE_URL ||
  process.env.R2_PUBLIC_URL ||
  'https://images.uomarchive.com'
).replace(/\/$/, '')

const contentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
])

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_KEY,
    secretAccessKey: process.env.R2_SECRET,
  },
})

const files = (await listFiles(assetsDir)).filter((file) =>
  contentTypes.has(extname(file).toLowerCase()),
)

if (files.length === 0) {
  console.error(`No supported image assets found in: ${assetsDir}`)
  process.exit(1)
}

for (const file of files) {
  const key = relative(assetsDir, file).split(sep).join('/')
  const fileStat = await stat(file)
  const contentType = contentTypes.get(extname(file).toLowerCase())

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: createReadStream(file),
      ContentLength: fileStat.size,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  console.log(`${publicBaseUrl}/${key}`)
}

console.log(`Uploaded ${files.length} seed image assets to R2.`)
