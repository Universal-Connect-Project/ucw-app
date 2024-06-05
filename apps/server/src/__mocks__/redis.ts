let storageObject: Record<string, any> = {}

export const clearRedisMock = () => {
  storageObject = {}
}

export const createClient = () => ({
  connect: async () => true,
  get: (key: string) => {
    return storageObject[key]
  },
  isReady: true,
  set: (key: string, value: any) => {
    storageObject[key] = value
  }
})
