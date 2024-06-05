import { getPreferences } from './preferences'
import { get } from '..//serviceClients/storageClient/redis'
import { PREFERENCES_REDIS_KEY } from '../serviceClients/storageClient/constants'

describe('preferences', () => {
  it('caches the local preferences and returns them when calling getPreferences', async () => {
    const redisPreferences = await get(PREFERENCES_REDIS_KEY)

    // This test will fail if there are no local preferences
    expect(Object.keys(redisPreferences).length).toBeGreaterThan(0)

    expect(await getPreferences()).toEqual(redisPreferences)
  })
})
