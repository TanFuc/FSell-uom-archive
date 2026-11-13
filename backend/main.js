'use strict'

process.env.NODE_ENV ||= 'production'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.SHARP_CONCURRENCY ||= '1'
process.env.REQUEST_LOGGING_ENABLED ||= 'false'
process.env.METRICS_ENABLED ||= 'false'
process.env.REDIS_CONNECT_TIMEOUT_MS ||= '5000'
process.env.REDIS_MAX_RETRIES ||= '3'

require('./dist/src/main.js')
