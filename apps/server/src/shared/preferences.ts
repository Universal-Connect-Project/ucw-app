import { PREFERENCES_REDIS_KEY } from '../serviceClients/storageClient/constants'
import { get } from '../serviceClients/storageClient/redis'

export interface Preferences {
  defaultProvider?: 'mx' | 'sophtron'

  defaultProviderVolume?: Record<string, number>

  institutionProviderVolumeMap?: Record<string, Record<string, number>>

  hiddenInstitutions?: string[]

  recommendedInstitutions: string[]
}

export const getPreferences = async (): Promise<Preferences> => {
  const preferencesGotten = await get(PREFERENCES_REDIS_KEY)

  return preferencesGotten
}
