#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const args = new Set(process.argv.slice(2))
const isWriteMode = args.has('--write')
const isCheckMode = args.has('--check') || !isWriteMode

const rootDir = process.cwd()
const targets = ['backend', 'frontend']
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
const ignoredDirs = new Set(['node_modules', '.next', 'dist', 'coverage', '.git'])

function walk(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue
      walk(fullPath, files)
      continue
    }

    if (!allowedExtensions.has(path.extname(entry.name))) continue
    files.push(fullPath)
  }

  return files
}

function cleanContent(content) {
  let next = content

  // Remove whole-line console logs.
  next = next.replace(/^\s*console\.log\(.*\)\s*;?\s*$/gm, '')

  // Remove single-line tagged comments.
  next = next.replace(/^\s*\/\/\s*(TODO|FIXME|HACK|XXX|DEBUG|NOTE)\b.*\r?\n?/gim, '')

  // Remove block comments that are tag-based.
  next = next.replace(/\/\*\s*(TODO|FIXME|HACK|XXX|DEBUG|NOTE)[\s\S]*?\*\//gim, '')

  // Collapse 3+ blank lines to 2.
  next = next.replace(/\n{3,}/g, '\n\n')

  return next
}

function main() {
  const changedFiles = []

  for (const target of targets) {
    const fullTarget = path.join(rootDir, target)
    if (!fs.existsSync(fullTarget)) continue

    const files = walk(fullTarget)

    for (const filePath of files) {
      const before = fs.readFileSync(filePath, 'utf8')
      const after = cleanContent(before)
      if (before === after) continue

      changedFiles.push(filePath)

      if (isWriteMode) {
        fs.writeFileSync(filePath, after, 'utf8')
      }
    }
  }

  if (changedFiles.length === 0) {
    console.log('cleanup-code: no changes needed')
    process.exit(0)
  }

  console.log('cleanup-code: files with cleanup changes:')
  for (const filePath of changedFiles) {
    console.log(`- ${path.relative(rootDir, filePath)}`)
  }

  if (isCheckMode && !isWriteMode) {
    console.error('\ncleanup-code check failed. Run: npm run cleanup:code')
    process.exit(1)
  }
}

main()
