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

const FIELD_NAMES_VI: Record<string, string> = {
  material: 'Chất liệu',
  dimensions: 'Kích thước',
  nameVi: 'Tên tiếng Việt',
  nameEn: 'Tên tiếng Anh',
  slug: 'Đường dẫn (slug)',
  descriptionVi: 'Mô tả tiếng Việt',
  descriptionEn: 'Mô tả tiếng Anh',
  priceVND: 'Giá VND',
  priceUSD: 'Giá USD',
  stock: 'Số lượng tồn kho',
  images: 'Hình ảnh',
  categoryId: 'Danh mục',
  email: 'Email',
  password: 'Mật khẩu',
}

function translateValidationMessageVi(msg: string): string {
  if (typeof msg !== 'string') return msg
  const trimmed = msg.trim()

  const emptyMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+should not be empty$/i)
  if (emptyMatch) {
    const field = emptyMatch[1]
    const vi = FIELD_NAMES_VI[field] || field
    return `Vui lòng nhập ${vi}`
  }
  const strMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be a string$/i)
  if (strMatch) {
    const field = strMatch[1]
    const vi = FIELD_NAMES_VI[field] || field
    return `${vi} phải là chuỗi ký tự`
  }
  const numMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be a number/i)
  if (numMatch) {
    const field = numMatch[1]
    const vi = FIELD_NAMES_VI[field] || field
    return `${vi} phải là số hợp lệ`
  }
  const intMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+must be an integer/i)
  if (intMatch) {
    const field = intMatch[1]
    const vi = FIELD_NAMES_VI[field] || field
    return `${vi} phải là số nguyên`
  }
  return trimmed
}

function normalizeClientMessage(
  status: HttpStatus,
  message: string | string[],
  request?: Request,
): string | string[] {
  const isVi = request?.headers['accept-language']?.includes('vi')

  if (Array.isArray(message)) {
    return isVi ? message.map(translateValidationMessageVi) : message
  }

  if (status === HttpStatus.BAD_REQUEST && isMalformedJsonMessage(message)) {
    return isVi
      ? 'Dữ liệu JSON không hợp lệ. Vui lòng kiểm tra lại cấu trúc JSON.'
      : 'Invalid JSON payload. Use valid JSON with double-quoted keys, e.g. {"email":"admin@uomarchive.com","password":"your-password"}.'
  }

  return isVi ? translateValidationMessageVi(message) : message
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

    const normalizedMessage = normalizeClientMessage(status as HttpStatus, message, request)

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
