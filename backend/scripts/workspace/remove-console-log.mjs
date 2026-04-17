import { promises as fs } from 'fs'
import path from 'path'

const rootDir = process.cwd()
const includeDirs = ['backend/src', 'frontend/app', 'frontend/components', 'frontend/hooks', 'frontend/lib']
const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (fileExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function removeConsoleLogStatements(content) {
  const lines = content.split('\n')
  let removed = 0

  const nextLines = lines.filter((line) => {
    if (line.includes('console.log(')) {
      removed += 1
      return false
    }
    return true
  })

  return {
    nextContent: nextLines.join('\n'),
    removed,
  }
}

async function run() {
  let totalRemoved = 0
  let changedFiles = 0

  for (const relDir of includeDirs) {
    const targetDir = path.join(rootDir, relDir)
    const exists = await fs
      .access(targetDir)
      .then(() => true)
      .catch(() => false)

    if (!exists) continue

    const files = await walk(targetDir)

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8')
      const { nextContent, removed } = removeConsoleLogStatements(content)

      if (removed > 0) {
        await fs.writeFile(filePath, nextContent, 'utf8')
        changedFiles += 1
        totalRemoved += removed
      }
    }
  }

  process.stdout.write(
    `[remove-console-log] Updated ${changedFiles} file(s), removed ${totalRemoved} console.log statement(s).\n`,
  )
}

run().catch((error) => {
  process.stderr.write(`[remove-console-log] Failed: ${error?.message || error}\n`)
  process.exit(1)
})
