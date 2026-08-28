'use strict'

// Passenger intercepts the first listen() call. LiteSpeed's lsnode.js does the
// same but does not inject PORT, so provide a harmless fallback for that host.
process.env.PORT ||= '3001'

process.env.NODE_ENV ||= 'production'
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.SHARP_CONCURRENCY ||= '1'
process.env.REQUEST_LOGGING_ENABLED ||= 'false'
process.env.METRICS_ENABLED ||= 'false'

let entry

try {
  entry = require('./dist/main.js')
} catch (error) {
  if (error && error.code === 'MODULE_NOT_FOUND' && /dist[\\/]main\.js/.test(error.message)) {
    entry = require('./dist/src/main.js')
  } else {
    throw error
  }
}

if (typeof entry.bootstrap !== 'function') {
  throw new TypeError('The compiled NestJS entry does not export bootstrap()')
}

entry.bootstrap().catch((error) => {
  console.error('NestJS bootstrap failed:', error)
  process.exitCode = 1
})
