import { readFileSync } from 'fs'
import { resolve } from 'path'
import { StorageClient } from '..//serviceClients/storageClient'

const redis = new StorageClient()

const preferencesKey = 'preferences'

const cacheLocalPreferences = async () => {
  let preferencesToSet
  try {
    preferencesToSet = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          process.env.NODE_ENV === 'test'
            ? '../../cachedDefaults/testData/testPreferences.json'
            : '../../cachedDefaults/preferences.json'
        )
      )?.toString()
    )
  } catch {}

  await redis.set(preferencesKey, preferencesToSet || {})
}

void cacheLocalPreferences()

interface Preferences {
  defaultProvider: 'mx' | 'sophtron'

  defaultProviderVolume: Record<string, number>

  institutionProviderVolumeMap: Record<string, Record<string, number>>

  hiddenInstitutions: string[]

  recommendedInstitutions: string[]
}

export const getPreferences = async (): Promise<Preferences> =>
  await redis.get(preferencesKey)
