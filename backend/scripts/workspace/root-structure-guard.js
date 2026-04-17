#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '../../..')
const args = new Set(process.argv.slice(2))
const mode = args.has('--hard') ? 'hard' : 'safe'

const allowListSafe = new Set(['.git', 'backend', 'frontend', 'node_modules'])
const allowListHard = new Set(['.git', 'backend', 'frontend'])
const allowList = mode === 'hard' ? allowListHard : allowListSafe

function isDirectory(fullPath) {
  try {
    return fs.statSync(fullPath).isDirectory()
  } catch {
    return false
  }
}

function main() {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
  const removed = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (allowList.has(entry.name)) continue

    const fullPath = path.join(rootDir, entry.name)
    if (!isDirectory(fullPath)) continue

    fs.rmSync(fullPath, { recursive: true, force: true })
    removed.push(entry.name)
  }

  if (removed.length === 0) {
    console.log(`[root-structure-guard] mode=${mode}: no extra root directories found`)
    return
  }

  console.log(`[root-structure-guard] mode=${mode}: removed directories:`)
  for (const name of removed) {
    console.log(`- ${name}`)
  }
}

main()
