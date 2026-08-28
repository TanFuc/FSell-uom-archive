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

require('./.next/standalone/server.js')
