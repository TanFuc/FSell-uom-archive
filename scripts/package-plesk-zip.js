'use strict'

const { createWriteStream, existsSync, mkdirSync, rmSync } = require('node:fs')
const path = require('node:path')
const archiver = require('../backend/node_modules/archiver')

const rootDir = path.resolve(__dirname, '..')
const releaseDir = path.join(rootDir, 'release')
const backendDir = path.join(rootDir, 'backend')
const frontendDir = path.join(rootDir, 'frontend')

mkdirSync(releaseDir, { recursive: true })

function createZipArchive(sourceMappings, outputZipPath) {
  return new Promise((resolve, reject) => {
    rmSync(outputZipPath, { force: true })
    const output = createWriteStream(outputZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      console.log(`✓ Created: ${outputZipPath} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`)
      resolve()
    })

    output.on('error', reject)
    archive.on('error', reject)
    archive.pipe(output)

    for (const mapping of sourceMappings) {
      if (mapping.type === 'file' && existsSync(mapping.source)) {
        archive.file(mapping.source, { name: mapping.target })
      } else if (mapping.type === 'directory' && existsSync(mapping.source)) {
        if (mapping.filter) {
          archive.directory(mapping.source, mapping.target, mapping.filter)
        } else {
          archive.directory(mapping.source, mapping.target)
        }
      } else if (mapping.type === 'string') {
        archive.append(mapping.content, { name: mapping.target })
      }
    }

    archive.finalize().catch(reject)
  })
}

async function main() {
  console.log('Packaging Plesk Production Archives...')

  // 1. Backend files to include
  const backendMappings = [
    { type: 'directory', source: path.join(backendDir, 'dist'), target: 'dist' },
    { type: 'directory', source: path.join(backendDir, 'prisma'), target: 'prisma' },
    {
      type: 'directory',
      source: path.join(backendDir, 'node_modules'),
      target: 'node_modules',
      filter: (entry) => {
        if (entry.name && entry.name.includes('.cache')) return false
        return entry
      },
    },
    { type: 'directory', source: path.join(backendDir, 'public'), target: 'public' },
    { type: 'file', source: path.join(backendDir, 'package.json'), target: 'package.json' },
    { type: 'file', source: path.join(backendDir, 'package-lock.json'), target: 'package-lock.json' },
    { type: 'file', source: path.join(backendDir, '.htaccess'), target: '.htaccess' },
    { type: 'file', source: path.join(backendDir, 'litespeed-entry.js'), target: 'litespeed-entry.js' },
    { type: 'file', source: path.join(backendDir, 'passenger-backend.js'), target: 'passenger-backend.js' },
    { type: 'file', source: path.join(backendDir, '.env.example'), target: '.env.example' },
    { type: 'string', content: `${new Date().toISOString()}\n`, target: 'tmp/restart.txt' },
  ]

  // 2. Frontend files to include
  const frontendMappings = [
    { type: 'directory', source: path.join(frontendDir, '.next'), target: '.next' },
    { type: 'directory', source: path.join(frontendDir, 'public'), target: 'public' },
    { type: 'file', source: path.join(frontendDir, 'package.json'), target: 'package.json' },
    { type: 'file', source: path.join(frontendDir, 'package-lock.json'), target: 'package-lock.json' },
    { type: 'file', source: path.join(frontendDir, 'next.config.js'), target: 'next.config.js' },
    { type: 'file', source: path.join(frontendDir, '.htaccess'), target: '.htaccess' },
    { type: 'file', source: path.join(frontendDir, 'litespeed-entry.js'), target: 'litespeed-entry.js' },
    { type: 'file', source: path.join(frontendDir, 'passenger-frontend.js'), target: 'passenger-frontend.js' },
    { type: 'file', source: path.join(frontendDir, '.env.example'), target: '.env.example' },
    { type: 'string', content: `${new Date().toISOString()}\n`, target: 'tmp/restart.txt' },
  ]

  const backendZip = path.join(releaseDir, 'api.uomarchive.com.zip')
  const frontendZip = path.join(releaseDir, 'uomarchive.com.zip')

  console.log('\n[1/3] Packaging Backend (api.uomarchive.com.zip)...')
  await createZipArchive(backendMappings, backendZip)

  console.log('\n[2/3] Packaging Frontend (uomarchive.com.zip)...')
  await createZipArchive(frontendMappings, frontendZip)

  // 3. All-in-one ZIP (with directories matching Plesk document roots)
  console.log('\n[3/3] Packaging All-in-one (uomarchive-plesk-all.zip)...')
  const allInOneMappings = [
    ...backendMappings.map((m) => ({
      ...m,
      target: path.posix.join('api.uomarchive.com', m.target),
    })),
    ...frontendMappings.map((m) => ({
      ...m,
      target: path.posix.join('uomarchive.com', m.target),
    })),
  ]
  const allZip = path.join(releaseDir, 'uomarchive-plesk-all.zip')
  await createZipArchive(allInOneMappings, allZip)

  console.log('\n========================================')
  console.log('ALL PACKAGES CREATED SUCCESSFULLY IN:')
  console.log(releaseDir)
  console.log('========================================\n')
}

main().catch((err) => {
  console.error('Packaging failed:', err)
  process.exit(1)
})
