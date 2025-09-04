import { PREFERENCES_REDIS_KEY } from "../services/storageClient/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storageObject: Record<string, any> = {};
let expiryObject: Record<string, number> = {}; // Store expiry timestamps

export const clearRedisMock = () => {
  if (storageObject?.[PREFERENCES_REDIS_KEY]) {
    storageObject = {
      [PREFERENCES_REDIS_KEY]: storageObject[PREFERENCES_REDIS_KEY],
    };
  } else {
    storageObject = {};
  }
  expiryObject = {};
};

export const sAdd = jest.fn((key: string, values: string[]) => {
  storageObject[key] = values;
});
export const del = jest.fn((key: string) => {
  delete storageObject[key];
  delete expiryObject[key];
});

export const sMembers = jest.fn((key: string) => {
  return storageObject[key];
});

export const get = jest.fn((key: string) => {
  const now = Date.now();
  const expiry = expiryObject[key];
  if (expiry && now > expiry) {
    delete storageObject[key];
    delete expiryObject[key];
    return undefined;
  }
  return storageObject[key];
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const set = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (key: string, value: any, options?: { EX?: number }) => {
    storageObject[key] = value;
    if (options && typeof options.EX === "number") {
      expiryObject[key] = Date.now() + options.EX * 1000;
    }
  },
);

export const keys = jest.fn((key) => {
  return Object.keys(storageObject).filter((k) =>
    k.startsWith(key.replace("*", "")),
  );
});

export const createClient = () => ({
  connect: async () => {
    return true;
  },
  get,
  isReady: true,
  set,
  sAdd,
  sMembers,
  del,
  keys,
});

export const redisClient = createClient();
export const overwriteSet = sAdd;
export const getSet = sMembers;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setNoExpiration = async (key: string, value: any) => {
  return set(key, value);
};
