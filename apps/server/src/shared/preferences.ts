import { PREFERENCES_REDIS_KEY } from '../services/storageClient/constants'
import { get } from '../services/storageClient/redis'
import type { Provider } from './contract'

export interface Preferences {
  defaultProvider?: Provider

  supportedProviders?: Provider[]

  defaultProviderVolume?: Record<string, number>

  institutionProviderVolumeMap?: Record<string, Record<string, number>>

  hiddenInstitutions?: string[]

  recommendedInstitutions: string[]
}

export const getPreferences = async (): Promise<Preferences> => {
  const preferencesGotten = await get(PREFERENCES_REDIS_KEY)

  return preferencesGotten
}
