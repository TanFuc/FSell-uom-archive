import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) return undefined

  try {
    const url = new URL(rawUrl)
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '10')
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '20')
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '15')
    }
    return url.toString()
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?'
    const hasLimit = rawUrl.includes('connection_limit=')
    const hasTimeout = rawUrl.includes('pool_timeout=')
    let additions = ''
    if (!hasLimit) additions += `${separator}connection_limit=10`
    if (!hasTimeout) additions += `${additions ? '&' : separator}pool_timeout=20`
    return `${rawUrl}${additions}`
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const dbUrl = getOptimizedDatabaseUrl()
    super(dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined)
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Prisma connected to database (connection_limit=10, pool_timeout=20s)')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Prisma disconnected from database')
  }
}

