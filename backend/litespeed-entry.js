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

require(mainFile)
