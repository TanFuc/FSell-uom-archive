'use strict'

const { cpSync, existsSync, mkdirSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const workspace = __dirname
const backendRoot = path.join(workspace, 'backend')
const frontendRoot = path.join(workspace, 'frontend')
const npmFilename = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const bundledNpm = path.join(path.dirname(process.execPath), npmFilename)
const npmCommand = existsSync(bundledNpm) ? bundledNpm : npmFilename
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')

function runBuild(projectRoot, label) {
  console.log(`Building ${label}...`)
  const command = existsSync(npmCli) ? process.execPath : npmCommand
  const args = existsSync(npmCli) ? [npmCli, 'run', 'build'] : ['run', 'build']
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: process.env.BUILD_NODE_OPTIONS || '--max-old-space-size=1024 --v8-pool-size=1',
      UV_THREADPOOL_SIZE: '1',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${label} build failed with exit code ${result.status}`)
  }
}

function copyFrontendAssets() {
  const nextRoot = path.join(frontendRoot, '.next')
  const standaloneRoot = path.join(nextRoot, 'standalone')
  const serverEntry = path.join(standaloneRoot, 'server.js')
  const staticSource = path.join(nextRoot, 'static')
  const publicSource = path.join(frontendRoot, 'public')

  if (!existsSync(serverEntry) || !existsSync(staticSource)) {
    throw new Error('Next.js standalone output is incomplete')
  }

  cpSync(staticSource, path.join(standaloneRoot, '.next', 'static'), {
    recursive: true,
    force: true,
  })

  if (existsSync(publicSource)) {
    cpSync(publicSource, path.join(standaloneRoot, 'public'), {
      recursive: true,
      force: true,
    })
  }
}

function triggerPassengerRestart(projectRoot) {
  const tmpRoot = path.join(projectRoot, 'tmp')
  mkdirSync(tmpRoot, { recursive: true })
  writeFileSync(path.join(tmpRoot, 'restart.txt'), `${new Date().toISOString()}\n`)
}

try {
  runBuild(backendRoot, 'NestJS backend')
  runBuild(frontendRoot, 'Next.js frontend')
  copyFrontendAssets()
  triggerPassengerRestart(backendRoot)
  triggerPassengerRestart(frontendRoot)
  console.log('Plesk build assets are ready; Passenger restart triggers were updated.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
