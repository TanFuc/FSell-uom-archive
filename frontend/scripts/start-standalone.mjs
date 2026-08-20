import { spawn } from 'node:child_process'
import path from 'node:path'
import './prepare-standalone.mjs'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const serverEntry = path.join(standaloneDir, 'server.js')

const child = spawn(process.execPath, [serverEntry], {
  cwd: standaloneDir,
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
