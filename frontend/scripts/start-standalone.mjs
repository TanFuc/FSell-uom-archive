import { createRequire } from 'node:module'
import path from 'node:path'
import './prepare-standalone.mjs'

process.env.NODE_ENV ||= 'production'
process.env.NEXT_TELEMETRY_DISABLED ||= '1'
process.env.NEXT_PRIVATE_WORKER_THREADS ||= '0'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const serverEntry = path.join(standaloneDir, 'server.js')
const require = createRequire(import.meta.url)

process.chdir(standaloneDir)
require(serverEntry)
