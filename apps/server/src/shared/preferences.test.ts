import { PREFERENCES_REDIS_KEY } from '../services/storageClient/constants'
import { get } from '../services/storageClient/redis'
import { getPreferences } from './preferences'

describe('preferences', () => {
  it('returns cached local preferences when calling getPreferences', async () => {
    const redisPreferences = await get(PREFERENCES_REDIS_KEY)

    // This test will fail if there are no local preferences
    expect(Object.keys(redisPreferences).length).toBeGreaterThan(0)

    expect(await getPreferences()).toEqual(redisPreferences)
  })
})
