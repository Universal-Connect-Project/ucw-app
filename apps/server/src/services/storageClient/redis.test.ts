import { getPreferences } from '../../shared/preferences'
import { get, set, setNoExpiration } from './redis'
import preferences from '../../../cachedDefaults/preferences.json'
import { set as mockSet } from '../../__mocks__/redis'
import config from '../../config'

describe('redis', () => {
  it('loads the preferences into the cache after successful connection', async () => {
    expect(await getPreferences()).toEqual(preferences)
  })

  describe('get', () => {
    it('gets a JSON.parsed value from the cache', async () => {
      const values = [
        false,
        'testString',
        { test: true },
        1234,
        null,
        undefined
      ]
      const key = 'key'

      for (const value of values) {
        await set(key, value)

        expect(await get(key)).toEqual(value)
      }
    })
  })

  describe('set', () => {
    it('calls set on the client with EX by default', async () => {
      await set('test', 'test')

      expect(mockSet).toHaveBeenCalledWith('test', JSON.stringify('test'), {
        EX: config.RedisCacheTimeSeconds
      })
    })

    it('calls set on the client with overriden parameters', async () => {
      await set('test', 'test', {})

      expect(mockSet).toHaveBeenCalledWith('test', JSON.stringify('test'), {})
    })
  })

  describe('setNoExpiration', () => {
    it('calls set on the client with no extra parameters', async () => {
      await setNoExpiration('test', 'test')

      expect(mockSet).toHaveBeenCalledWith('test', JSON.stringify('test'), {})
    })
  })
})
