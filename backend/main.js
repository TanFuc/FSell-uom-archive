'use strict'

process.env.NODE_ENV ||= 'production'
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library'
// Cấu hình ép 1 luồng của bạn rất tuyệt vời:
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.SHARP_CONCURRENCY ||= '1'

process.env.REQUEST_LOGGING_ENABLED ||= 'false'
process.env.METRICS_ENABLED ||= 'false'
process.env.REDIS_CONNECT_TIMEOUT_MS ||= '5000'
process.env.REDIS_MAX_RETRIES ||= '3'

// CHỈ CẦN REQUIRE là NestJS sẽ tự động chạy
require('./dist/src/main.js')
