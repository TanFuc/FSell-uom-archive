import { readFile, writeFile } from 'node:fs/promises'

const driver = process.argv[2]
const map = {
  postgresql: 'schema.postgresql.prisma',
  mysql: 'schema.mysql.prisma',
  mariadb: 'schema.mysql.prisma',
}

const target = map[driver]

if (!target) {
  console.error('Usage: node scripts/prisma-switch.mjs <postgresql|mysql|mariadb>')
  process.exit(1)
}

const sourcePath = new URL(`../prisma/${target}`, import.meta.url)
const schemaPath = new URL('../prisma/schema.prisma', import.meta.url)

const source = await readFile(sourcePath, 'utf8')
await writeFile(schemaPath, source, 'utf8')

console.log(`Prisma schema switched to ${driver}. Run: npm run prisma:generate`)
