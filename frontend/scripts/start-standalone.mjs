import { createRequire } from 'node:module'
import path from 'node:path'
import './prepare-standalone.mjs'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const serverEntry = path.join(standaloneDir, 'server.js')
const require = createRequire(import.meta.url)

process.chdir(standaloneDir)
require(serverEntry)
