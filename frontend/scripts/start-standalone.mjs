import { createRequire } from 'node:module'
import path from 'node:path'

process.env.NODE_ENV ||= 'production'
process.env.UV_THREADPOOL_SIZE ||= '1'
process.env.NEXT_TELEMETRY_DISABLED ||= '1'
process.env.NEXT_PRIVATE_WORKER_THREADS ||= '0'
process.env.NODE_OPTIONS ||= '--v8-pool-size=1'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const serverEntry = path.join(standaloneDir, 'server.js')
const require = createRequire(import.meta.url)

process.chdir(standaloneDir)
require(serverEntry)
