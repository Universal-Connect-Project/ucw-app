import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from 'redis'
import config from '../../config'

import { debug, error, info } from '../../infra/logger'
import { PREFERENCES_REDIS_KEY } from './constants'

const redisClient = createClient({
  url: config.RedisServer
})

export const overwriteSet = async (key: string, values: string[]) => {
  debug(`Redis overwriteSet: ${key}, ready: ${redisClient.isReady}`)
  try {
    await redisClient.del(key)
    await redisClient.sAdd(key, values)
  } catch {
    error('Failed to add to Redis SET with SADD command')
  }
}

export const getSet = async (key: string) => {
  debug(`Redis getSet: ${key}, ready: ${redisClient.isReady}`)
  try {
    return await redisClient.sMembers(key)
  } catch {
    error('Failed to get set from Redis')
  }
}

export const get = async (key: string) => {
  debug(`Redis get: ${key}, ready: ${redisClient.isReady}`)

  try {
    const ret = await redisClient.get(key)
    return JSON.parse(ret)
  } catch {}
}

export const set = async (
  key: string,
  value: any,
  params: object = {
    EX: config.RedisCacheTimeSeconds
  }
) => {
  debug(`Redis set: ${key}, ready: ${redisClient.isReady}`)

  try {
    await redisClient.set(key, JSON.stringify(value), params)
  } catch {}
}

export const setNoExpiration = async (key: string, value: any) => {
  await set(key, value, {})
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
      error(`Failed to resolve preferences: ${error}`)
    }

    await setNoExpiration(PREFERENCES_REDIS_KEY, preferencesToSet || {})
  })
  .catch((reason) => {
    error('Failed to connect to redis server: ' + reason)
    info('No redis connection')
  })
