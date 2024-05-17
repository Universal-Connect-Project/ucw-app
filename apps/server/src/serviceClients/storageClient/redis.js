import { createClient } from "redis"
import config from "../../config"

import { info, debug, error } from "../../infra/logger"

const redisClient = createClient({
  url: config.RedisServer,
})

const useRedis =
  config.Env !== "dev" && config.Env !== "mocked" && config.Env !== "local"

if (useRedis) {
  redisClient
    .connect()
    .then(() => {
      info("Redis connection established with server: " + config.RedisServer)
    })
    .catch((reason) => {
      error("Failed to connect to redis server: " + reason)
      info("No redis connection")
    })
}

const localCache = {
  // TODO: expiry?
}
export class StorageClient {
  async get(key) {
    debug(`Redis get: ${key}, ready: ${redisClient.isReady}`)
    if (useRedis && redisClient.isReady) {
      const ret = await redisClient.get(key)
      return ret != null ? JSON.parse(ret) : null
    }
    return await Promise.resolve(localCache[key])
  }

  async set(key, obj) {
    debug(`Redis set: ${key}, ready: ${redisClient.isReady}`)
    if (useRedis && redisClient.isReady) {
      return await redisClient.set(key, JSON.stringify(obj), {
        EX: config.RedisCacheTimeSeconds,
      })
    }
    return await Promise.resolve((localCache[key] = obj))
  }
}
