import { createClient } from 'redis'
import config from '../../config'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { info, debug, error } from '../../infra/logger'
import { PREFERENCES_REDIS_KEY } from './constants'

const redisClient = createClient({
  url: config.RedisServer
})

export const get = async (key) => {
  debug(`Redis get: ${key}, ready: ${redisClient.isReady}`)
  if (redisClient.isReady) {
    const ret = await redisClient.get(key)
    return ret != null ? JSON.parse(ret) : null
  }
}

export const set = async (key, obj) => {
  debug(`Redis set: ${key}, ready: ${redisClient.isReady}`)
  if (redisClient.isReady) {
    return await redisClient.set(key, JSON.stringify(obj), {
      EX: config.RedisCacheTimeSeconds
    })
  }
}

export const setNoExpiration = async (key, obj) => {
  debug(`Redis set: ${key}, ready: ${redisClient.isReady}`)
  if (redisClient.isReady) {
    return await redisClient.set(key, JSON.stringify(obj))
  }
}

redisClient
  .connect()
  .then(async () => {
    info('Redis connection established with server: ' + config.RedisServer)

    let preferencesToSet
    try {
      preferencesToSet = JSON.parse(
        readFileSync(
          resolve(__dirname, '../../../cachedDefaults/preferences.json')
        )?.toString()
      )
    } catch (error) {
      console.log(error)
    }

    await setNoExpiration(PREFERENCES_REDIS_KEY, preferencesToSet || {})
  })
  .catch((reason) => {
    error('Failed to connect to redis server: ' + reason)
    info('No redis connection')
  })
