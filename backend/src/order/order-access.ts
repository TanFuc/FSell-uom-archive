import { createHmac, timingSafeEqual } from 'crypto'

export function createOrderAccessToken(orderId: string, secret: string): string {
  return createHmac('sha256', secret).update(`order-payment:${orderId}`).digest('hex')
}

export function matchesOrderAccessToken(orderId: string, secret: string, token?: string): boolean {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false
  const expected = Buffer.from(createOrderAccessToken(orderId, secret))
  const actual = Buffer.from(token)
  return timingSafeEqual(actual, expected)
}
