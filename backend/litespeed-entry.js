'use strict'

const fs = require('node:fs')
const path = require('node:path')

process.env.NODE_ENV = 'production'
process.env.PORT = process.env.PORT || '3001'
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.SHARP_CONCURRENCY ||= '1'
process.env.REQUEST_LOGGING_ENABLED ||= 'false'
process.env.METRICS_ENABLED ||= 'false'

const candidates = [path.join(__dirname, 'dist/main.js'), path.join(__dirname, 'dist/src/main.js')]
const mainFile = candidates.find((candidate) => fs.existsSync(candidate))

if (!mainFile) {
  throw new Error('NestJS build not found: expected dist/main.js or dist/src/main.js')
}

// Single-instance enforcement: kill any previous orphaned backend process
const PID_FILE = path.join(__dirname, '.backend.pid')
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
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (e) {}
  process.exit(0)
})
process.on('SIGINT', () => {
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (e) {}
  process.exit(0)
})

require(mainFile)
