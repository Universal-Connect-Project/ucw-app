import { setIntervalAsync } from 'set-interval-async'
import config from '../config'
import { info, warning as logWarning } from 'src/infra/logger'
import {
  deleteRemovedInstitutions,
  updateInstitutions
} from '../services/ElasticSearchClient'
import type { CachedInstitution } from '../shared/contract'
import { getAccessToken } from './auth0Service'
import { INSTITUTION_ETAG_REDIS_KEY } from './storageClient/constants'
import { get, setNoExpiration } from './storageClient/redis'

const RESPONSE_NOT_MODIFIED = 304
const SUCCESS_RESPONSE = 200
const UNAUTHORIZED_RESPONSE = 401

export async function setInstitutionSyncSchedule(minutes: number = 1) {
  return setIntervalAsync(
    async () => {
      info('Checking for institution list updates')
      await syncInstitutions()
    },
    minutes * 60 * 1000
  )
}

export const syncInstitutions = async () => {
  try {
    const response = await fetchInstitutions()
    if (!response) {
      logWarning('Institution Server not responding')
    } else if (response.status === RESPONSE_NOT_MODIFIED) {
      info('Institution Cache List unchanged. Skipping Update')
    } else if (response.status === SUCCESS_RESPONSE) {
      const newInstitutions = await response.json()
      if (newInstitutions.length > 0) {
        info('Updating institution cache list')
        await updateElasticSearchDocuments(newInstitutions)
        await setNoExpiration(
          INSTITUTION_ETAG_REDIS_KEY,
          response.headers.get('etag')
        )
      } else {
        logWarning('Institution Cache list response is empty')
      }
    } else if (response.status === UNAUTHORIZED_RESPONSE) {
      logWarning('Unauthorized access to institution cache list')
    }
  } catch (error) {
    logWarning(
      `Unable to get institution cache list from server: ${error.message}`
    )
  }
}

export async function fetchInstitutions(): Promise<Response | null> {
  const institutionCacheETag = await get(INSTITUTION_ETAG_REDIS_KEY)
  const accessToken = await getAccessToken()
  try {
    return await fetch(config.INSTITUTION_CACHE_LIST_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'If-None-Match': institutionCacheETag,
        'Cache-Control': 'public'
      }
    })
  } catch {
    return null
  }
}

async function updateElasticSearchDocuments(
  newInstitutions: CachedInstitution[]
) {
  await deleteRemovedInstitutions(newInstitutions)
  await updateInstitutions(newInstitutions)
}
