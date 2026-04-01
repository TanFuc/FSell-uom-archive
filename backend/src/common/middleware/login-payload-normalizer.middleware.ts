import { NextFunction, Request, Response } from 'express'

type LoginPayload = {
  email: string
  password: string
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const next = value.trim()
  return next.length > 0 ? next : undefined
}

function normalizeObjectPayload(payload: Record<string, unknown>): LoginPayload | null {
  const email = toStringValue(payload.email)
  const password = toStringValue(payload.password)

  if (!email || !password) return null

  return { email, password }
}

function parseUrlEncodedPayload(raw: string): LoginPayload | null {
  const params = new URLSearchParams(raw)
  const email = toStringValue(params.get('email'))
  const password = toStringValue(params.get('password'))

  if (!email || !password) return null

  return { email, password }
}

function parseRawPayload(raw: string): LoginPayload | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return normalizeObjectPayload(parsed as Record<string, unknown>)
    }
  } catch {
    // Ignore JSON parse errors and fallback to urlencoded parsing.
  }

  return parseUrlEncodedPayload(trimmed)
}

export function loginPayloadNormalizerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const body = req.body as unknown

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const normalized = normalizeObjectPayload(body as Record<string, unknown>)
    if (normalized) {
      req.body = normalized
    }
    return next()
  }

  if (typeof body === 'string') {
    const normalized = parseRawPayload(body)
    if (normalized) {
      req.body = normalized
    }
  }

  return next()
}
