import { env, hasDatabaseConfig } from '@/lib/env'

describe('Env Utils', () => {
  it('should export env object with default values if not provided', () => {
    expect(env.appUrl).toBeDefined()
    expect(env.sessionCookieName).toBeDefined()
  })

  it('hasDatabaseConfig should return boolean based on env', () => {
    const hasDb = hasDatabaseConfig()
    expect(typeof hasDb).toBe('boolean')
    if (env.databaseUrl.length > 0) {
      expect(hasDb).toBe(true)
    } else {
      expect(hasDb).toBe(false)
    }
  })
})
