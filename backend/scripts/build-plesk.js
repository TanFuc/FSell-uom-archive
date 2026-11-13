'use strict'

const {
  createWriteStream,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { createRequire } = require('node:module')
const { spawnSync } = require('node:child_process')

const backendRoot = path.resolve(__dirname, '..')
const outputFile = path.join(backendRoot, 'uom-backend-release.zip')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || backendRoot,
    env: options.env || process.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`)
  }
}

function delegateToLinux() {
  const pathMatch = __filename.match(/^([a-zA-Z]):[\\/](.*)$/)
  if (!pathMatch) throw new Error(`Cannot convert Windows path to WSL: ${__filename}`)

  const linuxScript = `/mnt/${pathMatch[1].toLowerCase()}/${pathMatch[2].replace(/\\/g, '/')}`
  const linuxNode = '/tmp/uom-node24-build/node-v24.19.0-linux-x64/bin/node'
  const linuxPath = '/tmp/uom-node24-build/node-v24.19.0-linux-x64/bin:/usr/local/bin:/usr/bin:/bin'
  run('wsl.exe', [
    'env',
    '-i',
    'HOME=/tmp',
    'TMPDIR=/tmp',
    `PATH=${linuxPath}`,
    linuxNode,
    linuxScript,
    '--linux-child',
  ])
}

function copyProject(source, destination) {
  const excluded = new Set([
    '.git',
    'dist',
    'node_modules',
    'release-be',
    'uom-backend-release.zip',
  ])

  cpSync(source, destination, {
    recursive: true,
    filter(current) {
      const relative = path.relative(source, current)
      if (!relative) return true

      const firstSegment = relative.split(path.sep)[0]
      if (excluded.has(firstSegment)) return false

      const name = path.basename(current)
      if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) {
        return false
      }

      return true
    },
  })
}

function copyRequired(source, destination) {
  for (const name of ['dist', 'node_modules', 'prisma']) {
    cpSync(path.join(source, name), path.join(destination, name), { recursive: true })
  }

  for (const name of ['package.json', 'package-lock.json', 'litespeed-entry.js', '.htaccess']) {
    const sourceFile = path.join(source, name)
    if (existsSync(sourceFile)) cpSync(sourceFile, path.join(destination, name))
  }

  mkdirSync(path.join(destination, 'tmp'), { recursive: true })
  writeFileSync(path.join(destination, 'tmp', 'restart.txt'), `${new Date().toISOString()}\n`)
}

function verifyLibraryEngine(projectRoot) {
  const clientRoot = path.join(projectRoot, 'node_modules', '.prisma', 'client')
  const engines = existsSync(clientRoot)
    ? readdirSync(clientRoot).filter(
        (name) => name.startsWith('libquery_engine-') && name.endsWith('.so.node'),
      )
    : []

  const hasLinuxEngine = engines.some(
    (name) => name.includes('debian-openssl-3.0.x') || name.includes('linux-musl-openssl-3.0.x'),
  )

  if (!hasLinuxEngine) {
    throw new Error('Generated Prisma Client does not contain a Linux library query engine')
  }

  const spawnedEngines = existsSync(clientRoot)
    ? readdirSync(clientRoot).filter((name) => name.startsWith('query-engine-'))
    : []

  if (spawnedEngines.length > 0) {
    throw new Error(`Unexpected Prisma binary engines: ${spawnedEngines.join(', ')}`)
  }

  console.log(`Prisma library engines: ${engines.join(', ')}`)
}

async function createZip(archiver, source, destination) {
  rmSync(destination, { force: true })

  await new Promise((resolve, reject) => {
    const output = createWriteStream(destination)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
    archive.on('warning', (error) => {
      if (error.code !== 'ENOENT') reject(error)
    })

    archive.pipe(output)
    archive.directory(source, false)
    archive.finalize().catch(reject)
  })
}

async function buildLinuxRelease() {
  const buildRoot = mkdtempSync(path.join(tmpdir(), 'uom-backend-plesk-'))
  const projectRoot = path.join(buildRoot, 'backend')
  const releaseRoot = path.join(buildRoot, 'release-be')
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const cleanEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_')),
  )
  const buildEnv = {
    ...cleanEnvironment,
    PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ''}`,
    NODE_ENV: 'production',
    PRISMA_CLIENT_ENGINE_TYPE: 'library',
  }
  const installEnv = { ...buildEnv, NODE_ENV: 'development' }

  try {
    copyProject(backendRoot, projectRoot)
    mkdirSync(releaseRoot, { recursive: true })

    console.log(`Building Plesk backend with ${process.version} on ${process.platform}...`)
    run(npmCommand, ['ci', '--include=dev', '--no-audit', '--no-fund'], {
      cwd: projectRoot,
      env: installEnv,
    })
    run(npxCommand, ['prisma', 'generate'], { cwd: projectRoot, env: buildEnv })
    verifyLibraryEngine(projectRoot)
    run(npmCommand, ['run', 'build'], { cwd: projectRoot, env: buildEnv })

    copyRequired(projectRoot, releaseRoot)
    run(npmCommand, ['prune', '--omit=dev', '--no-audit', '--no-fund'], {
      cwd: releaseRoot,
      env: buildEnv,
    })
    verifyLibraryEngine(releaseRoot)

    const requireFromBuild = createRequire(path.join(projectRoot, 'package.json'))
    const archiver = requireFromBuild('archiver')
    await createZip(archiver, releaseRoot, outputFile)
    console.log(`Created: ${outputFile}`)
  } finally {
    rmSync(buildRoot, { recursive: true, force: true })
  }
}

async function main() {
  if (process.platform === 'win32' && !process.argv.includes('--linux-child')) {
    delegateToLinux()
    return
  }

  await buildLinuxRelease()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
