import type { Request, Response } from 'express'
// import type { Session } from 'express-session'
import {
  getRecommendedInstitutions,
  search,
  searchByRoutingNumber
} from '../services/ElasticSearchClient'
import { resolveInstitutionProvider } from '../services/institutionResolver'
import {
  PASSWORD_FIELD_TYPE,
  PROVIDER_SESSION_KEY,
  USER_NAME_FIELD_TYPE
} from '../services/storageClient/constants'
import type { MappedJobTypes } from '../shared/contract'
import {
  getProviderAdapter,
  mapCachedInstitution,
  mapResolvedInstitution
} from '../utils'
import { type ConnectApi } from './connectApi'

export interface InstitutionRequest extends Request {
  connectApi: ConnectApi
  session: any
}

export const getInstitutionHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  const resolvedInstitution = await resolveInstitutionProvider(
    req.params.institution_guid,
    req.context?.job_type as MappedJobTypes
  )

  req.session[PROVIDER_SESSION_KEY] = resolvedInstitution.provider

  res.send({ institution: mapResolvedInstitution(resolvedInstitution) })
}

export interface GetInstitutionsRequest extends InstitutionRequest {
  context: {
    job_type: MappedJobTypes
    provider: string
  }
  query: {
    routing_number?: string
    search_name?: string
  }
}

export const getInstitutionsHandler = async (
  req: GetInstitutionsRequest,
  res: Response
) => {
  let institutionHits
  if (req.query.routing_number) {
    institutionHits = await searchByRoutingNumber(
      req.query.routing_number,
      req.context?.job_type
    )
  } else {
    institutionHits = await search(req.query.search_name, req.context?.job_type)
  }

  res.send(institutionHits.map(mapCachedInstitution))
}

export const favoriteInstitutionsHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  const recommendedInstitutions = await getRecommendedInstitutions(
    req.context?.job_type as MappedJobTypes
  )
  const mappedFilteredInstitutions = recommendedInstitutions
    .filter((ins) => ins != null)
    .map(mapCachedInstitution)
  res.send(mappedFilteredInstitutions)
}

export interface GetInstitutionCredentialsRequest extends InstitutionRequest {
  params: {
    institution_guid: string
  }
}

export const getInstitutionCredentialsHandler = async (
  req: GetInstitutionCredentialsRequest,
  res: Response
) => {
  const provider = req.session[PROVIDER_SESSION_KEY]
  const providerAdapter = getProviderAdapter(provider)

  const institutionCreds = await providerAdapter.ListInstitutionCredentials(
    req.params.institution_guid
  )
  const mappedCreds = institutionCreds.map((c) => ({
    ...c,
    guid: c.id,
    field_type:
      c.field_type === 'PASSWORD' ? PASSWORD_FIELD_TYPE : USER_NAME_FIELD_TYPE
  }))
  res.send({
    credentials: mappedCreds
  })
}
