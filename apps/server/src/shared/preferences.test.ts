import { getRedisStorageObject } from '../__mocks__/redis'
import { getPreferences } from './preferences'

describe('preferences', () => {
  it('caches the local preferences and returns them when calling getPreferences', async () => {
    const redisPreferences = JSON.parse(getRedisStorageObject().preferences)

    // This test will fail if there are no local preferences
    expect(Object.keys(redisPreferences).length).toBeGreaterThan(0)

    expect(await getPreferences()).toEqual(redisPreferences)
  })
})
