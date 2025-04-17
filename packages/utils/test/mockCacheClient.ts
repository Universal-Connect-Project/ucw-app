let storageObject: Record<string, any> = {};

const constants = {
  PREFERENCES_REDIS_KEY: "preferences",
};

export const clearRedisMock = () => {
  if (storageObject?.[constants.PREFERENCES_REDIS_KEY]) {
    storageObject = {
      [constants.PREFERENCES_REDIS_KEY]:
        storageObject[constants.PREFERENCES_REDIS_KEY],
    };
  } else {
    storageObject = {};
  }
};

const sAdd = jest.fn((key: string, values: string[]) => {
  storageObject[key] = values;
});

const del = jest.fn((key: string) => {
  delete storageObject[key];
});

const sMembers = jest.fn((key: string) => {
  return storageObject[key];
});

const get = jest.fn((key: string) => {
  return storageObject[key];
});

const set = jest.fn((key: string, value: any) => {
  storageObject[key] = value;
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
  constants,
});
