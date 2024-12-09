import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "redis";
import config from "../../config";

import { debug, error, info } from "../../infra/logger";
import { PREFERENCES_REDIS_KEY } from "./constants";

const redisClient = createClient({
  url: config.REDIS_SERVER,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});

export const overwriteSet = async (key: string, values: string[]) => {
  debug(`Redis overwriteSet: ${key}, ready: ${redisClient.isReady}`);
  try {
    await redisClient.del(key);
    await redisClient.sAdd(key, values);
  } catch {
    error("Failed to add to Redis SET with SADD command");
  }
};

export const getSet = async (key: string) => {
  debug(`Redis getSet: ${key}, ready: ${redisClient.isReady}`);
  try {
    return await redisClient.sMembers(key);
  } catch {
    error("Failed to get set from Redis");
  }
};

export const get = async (key: string, safeToLog?: string) => {
  if (safeToLog) {
    debug(`Redis get: ${key}, ready: ${redisClient.isReady}`);
  }

  try {
    const ret = await redisClient.get(key);
    return JSON.parse(ret);
  } catch {
    error("Failed to get value from Redis");
  }
};

export const set = async (
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  params: object = {
    EX: config.REDIS_CACHE_TIME_SECONDS,
  },
  safeToLog?: string,
) => {
  if (safeToLog) {
    debug(`Redis set: ${key}, ready: ${redisClient.isReady}`);
  }

  try {
    await redisClient.set(key, JSON.stringify(value), params);
  } catch {
    error("Failed to set value in Redis");
  }
};

export const del = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch {
    error("Failed to delete value in Redis");
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setNoExpiration = async (key: string, value: any) => {
  await set(key, value, {});
};

redisClient
  .connect()
  .then(async () => {
    info("Redis connection established with server: " + config.REDIS_SERVER);

    let preferencesToSet;
    try {
      preferencesToSet = JSON.parse(
        readFileSync(
          resolve(__dirname, "../../../cachedDefaults/preferences.json"),
        )?.toString(),
      );
    } catch (reason) {
      error(`Failed to resolve preferences: ${reason}`);
    }

    await setNoExpiration(PREFERENCES_REDIS_KEY, preferencesToSet || {});
  })
  .catch((reason) => {
    error(
      `Failed to connect to redis server at ${config.REDIS_SERVER}: ` + reason,
    );
    info("No redis connection");
  });
