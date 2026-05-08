#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const rootDir = process.cwd()
const args = new Set(process.argv.slice(2))
const isWriteMode = args.has('--write')
const isCheckMode = args.has('--check') || !isWriteMode
const explicitFileArgs = process.argv
  .slice(2)
  .filter((arg) => !arg.startsWith('--'))
  .map((arg) => path.resolve(rootDir, arg))

const targets = ['backend', 'frontend']
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
const ignoredDirs = new Set(['node_modules', '.next', 'dist', 'coverage', '.git'])

function shouldSkipFile(filePath) {
  const baseName = path.basename(filePath)
  return baseName.endsWith('.d.ts') || baseName === 'next-env.d.ts'
}

function isAllowedTargetFile(filePath) {
  const extension = path.extname(filePath)
  if (!allowedExtensions.has(extension)) return false
  if (shouldSkipFile(filePath)) return false

  const relativePath = path.relative(rootDir, filePath)
  if (relativePath.startsWith('..')) return false

  const firstSegment = relativePath.split(path.sep)[0]
  return targets.includes(firstSegment)
}

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
    if (shouldSkipFile(fullPath)) continue
    files.push(fullPath)
  }

  return files
}

function cleanContent(content) {
  let next = content

  next = next.replace(/^\s*console\.log\(.*\)\s*;?\s*$/gm, '')
  next = next.replace(/\bconsole\.log\([^\n]*\)\s*;?/g, '')

  next = next.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  next = next.replace(/\/\*[\s\S]*?\*\//g, '')
  next = next.replace(/^\s*\/\/.*$/gm, '')
  next = next.replace(/^\s*\{\s*\}\s*$/gm, '')

  next = next.replace(/\n{3,}/g, '\n\n')

  return next
}

function main() {
  const changedFiles = []
  let filesToProcess = []

  if (explicitFileArgs.length > 0) {
    filesToProcess = explicitFileArgs.filter(isAllowedTargetFile)
  } else {
    for (const target of targets) {
      const fullTarget = path.join(rootDir, target)
      if (!fs.existsSync(fullTarget)) continue

      filesToProcess.push(...walk(fullTarget))
    }
  }

  for (const filePath of filesToProcess) {
    const before = fs.readFileSync(filePath, 'utf8')
    const after = cleanContent(before)
    if (before === after) continue

    changedFiles.push(filePath)

    if (isWriteMode) {
      fs.writeFileSync(filePath, after, 'utf8')
    }
  }

  if (changedFiles.length === 0) {
    process.exit(0)
  }
  for (const filePath of changedFiles) {
  }

  if (isCheckMode && !isWriteMode) {
    console.error('\ncleanup-code check failed. Run: npm run cleanup:code')
    process.exit(1)
  }
}

main()
