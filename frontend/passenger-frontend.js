'use strict'

process.env.UV_THREADPOOL_SIZE = '1'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.NEXT_TELEMETRY_DISABLED = '1'
process.env.PORT = process.env.PORT || '3000'
process.env.HOSTNAME = '0.0.0.0'

const fs = require('node:fs')
const path = require('node:path')

const appRoot = __dirname
const standaloneRoot = path.join(appRoot, '.next', 'standalone')
const serverEntry = path.join(standaloneRoot, 'server.js')
const nextEnvEntry = path.join(standaloneRoot, 'node_modules', '@next', 'env')

if (!fs.existsSync(serverEntry)) {
  throw new Error('Missing .next/standalone/server.js; run the deployment build first')
}

require(nextEnvEntry).loadEnvConfig(appRoot, false)

// Passenger and LiteSpeed lsnode.js both intercept the first listen() call.
// LiteSpeed does not inject PORT, so Next.js needs a harmless fallback value.
process.env.PORT ||= '3000'
process.env.NEXT_TELEMETRY_DISABLED ||= '1'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.HOSTNAME = '0.0.0.0'

// Standalone handles its own routing; minimal mode would skip middleware,
// redirects and rewrites when no external Next.js routing layer exists.
delete process.env.NEXT_PRIVATE_MINIMAL_MODE
delete process.env.NEXT_PRIVATE_WORKER_THREADS

// Next's generated standalone server reads Passenger's PORT and calls listen()
// in this process. Requiring it once avoids npm, child_process, PM2 and cluster.
process.chdir(standaloneRoot)
require(serverEntry)
