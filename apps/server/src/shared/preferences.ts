import { PREFERENCES_REDIS_KEY } from '../services/storageClient/constants'
import { get } from '../services/storageClient/redis'
import type { Aggregator } from './contract'

export interface Preferences {
  defaultAggregator?: Aggregator

  supportedAggregators?: Aggregator[]

  defaultAggregatorVolume?: Record<string, number>

  institutionAggregatorVolumeMap?: Record<string, Record<string, number>>

  hiddenInstitutions?: string[]

  recommendedInstitutions: string[]
}

export const getPreferences = async (): Promise<Preferences> => {
  return await get(PREFERENCES_REDIS_KEY)
}
