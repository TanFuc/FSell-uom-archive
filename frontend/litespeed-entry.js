'use strict'

process.env.NODE_ENV = 'production'

const { loadEnvConfig } = require('./.next/standalone/node_modules/@next/env')

// The generated standalone server uses .next/standalone as its working app
// directory, while Plesk keeps the deployment .env at the Application Root.
loadEnvConfig(__dirname, false)

process.env.PORT = process.env.PORT || '3000'
process.env.NEXT_TELEMETRY_DISABLED ||= '1'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.HOSTNAME = '0.0.0.0'

// Next.js standalone must own routing. Minimal mode skips middleware,
// redirects and rewrites and is only intended for an external routing layer.
delete process.env.NEXT_PRIVATE_MINIMAL_MODE
delete process.env.NEXT_PRIVATE_WORKER_THREADS

// Single-instance enforcement: kill any previous orphaned frontend process
const path = require('node:path')
const fs = require('node:fs')
const PID_FILE = path.join(__dirname, '.frontend.pid')
try {
  if (fs.existsSync(PID_FILE)) {
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10)
    if (oldPid && oldPid !== process.pid) {
      try {
        process.kill(oldPid, 'SIGKILL')
      } catch (e) {}
    }
  }
  fs.writeFileSync(PID_FILE, String(process.pid))
} catch (e) {}

process.on('SIGTERM', () => {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE)
  } catch (e) {}
  process.exit(0)
})
process.on('SIGINT', () => {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE)
  } catch (e) {}
  process.exit(0)
})

require('./.next/standalone/server.js')
