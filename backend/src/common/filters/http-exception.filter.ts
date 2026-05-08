import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { isProbePath } from '../security/probe-paths'

interface ExceptionResponse {
  message: string | string[]
  error?: string
  statusCode?: number
}

function isMalformedJsonMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return normalized.includes('json') && normalized.includes('position')
}

function normalizeClientMessage(status: HttpStatus, message: string | string[]): string | string[] {
  if (Array.isArray(message)) {
    return message
  }

  if (status === HttpStatus.BAD_REQUEST && isMalformedJsonMessage(message)) {
    return 'Invalid JSON payload. Use valid JSON with double-quoted keys, e.g. {"email":"admin@uomarchive.com","password":"your-password"}.'
  }

  return message
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else {
        const responseBody = exceptionResponse as ExceptionResponse
        message = responseBody.message || 'An error occurred'
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
      message = exception.message
    }

    const normalizedMessage = normalizeClientMessage(status as HttpStatus, message)

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: normalizedMessage,
    }

    const logPayload = JSON.stringify(errorResponse)
    const statusCode = status as HttpStatus
    const probe404 = statusCode === HttpStatus.NOT_FOUND && isProbePath(request.url)

    if (probe404) {
      this.logger.debug(`${request.method} ${request.url} - ${status}`, logPayload)
      response.status(status).json(errorResponse)
      return
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url} - ${status}`, logPayload)
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}`, logPayload)
    }

    response.status(status).json(errorResponse)
  }
}
