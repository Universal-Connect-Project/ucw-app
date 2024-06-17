import { PREFERENCES_REDIS_KEY } from '../services/storageClient/constants'

let storageObject: Record<string, any> = {}

export const clearRedisMock = () => {
  if (storageObject?.[PREFERENCES_REDIS_KEY]) {
    storageObject = {
      [PREFERENCES_REDIS_KEY]: storageObject[PREFERENCES_REDIS_KEY]
    }
  } else {
    storageObject = {}
  }
}

export const get = jest.fn((key: string) => {
  return storageObject[key]
})

export const set = jest.fn((key: string, value: any) => {
  storageObject[key] = value
})

export const createClient = () => ({
  connect: async () => {
    return true
  },
  get,
  isReady: true,
  set
})
