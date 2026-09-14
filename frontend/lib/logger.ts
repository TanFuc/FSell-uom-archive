/**
 * Unified application logger for UOM Archive
 * Replaces direct console.log usage, suppresses verbose debug logs in production,
 * and standardizes timestamped diagnostic output.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const IS_PROD = process.env.NODE_ENV === 'production'

class AppLogger {
  private formatPrefix(level: LogLevel, tag?: string): string {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false })
    const tagPart = tag ? ` [${tag}]` : ''
    return `[ƯƠM ${level.toUpperCase()}] ${timestamp}${tagPart}:`
  }

  debug(message: string, tag?: string, ...args: any[]) {
    if (!IS_PROD) {
      // eslint-disable-next-line no-console
      console.debug(this.formatPrefix('debug', tag), message, ...args)
    }
  }

  info(message: string, tag?: string, ...args: any[]) {
    if (!IS_PROD) {
      // eslint-disable-next-line no-console
      console.info(this.formatPrefix('info', tag), message, ...args)
    }
  }

  warn(message: string, tag?: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.warn(this.formatPrefix('warn', tag), message, ...args)
  }

  error(message: string, tag?: string, ...args: any[]) {
    // eslint-disable-next-line no-console
    console.error(this.formatPrefix('error', tag), message, ...args)
  }
}

export const logger = new AppLogger()
