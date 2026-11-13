import { isHardBlockedProbePath, isProbePath } from './probe-paths'

describe('probe paths', () => {
  it.each([
    '/api/env',
    '/api/heapdump',
    '/api/configprops',
    '/api/aws.json',
    '/api/credentials.json',
    '/api/config.json',
    '/api/settings.json',
    '/api/application.properties',
    '/api/appsettings.json',
    '/api/keys.json',
    '/api/secrets.json',
    '/api/v2/config.json',
    '/api/v1/config.json',
  ])('detects noisy sensitive-file probe %s', (path) => {
    expect(isProbePath(path)).toBe(true)
  })

  it('keeps real API settings routes available', () => {
    expect(isProbePath('/api/settings/site-content')).toBe(false)
    expect(isProbePath('/api/settings/branding')).toBe(false)
  })

  it('hard blocks dot-env requests', () => {
    expect(isHardBlockedProbePath('/api/.env')).toBe(true)
  })
})
