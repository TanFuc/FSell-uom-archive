import { createOrderAccessToken, matchesOrderAccessToken } from './order-access'

describe('order payment access', () => {
  it('accepts only the token for the matching order and secret', () => {
    const token = createOrderAccessToken('order-a', 'private-secret')
    expect(matchesOrderAccessToken('order-a', 'private-secret', token)).toBe(true)
    expect(matchesOrderAccessToken('order-b', 'private-secret', token)).toBe(false)
    expect(matchesOrderAccessToken('order-a', 'different-secret', token)).toBe(false)
    expect(matchesOrderAccessToken('order-a', 'private-secret', 'invalid')).toBe(false)
  })
})
