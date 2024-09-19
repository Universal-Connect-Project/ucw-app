import type { Request, Response } from 'express'
import type { MappedJobTypes } from '../shared/contract'
import { mapCachedInstitution } from './connectApi'
import { search, searchByRoutingNumber } from '../services/ElasticSearchClient'
import type { ConnectApi } from './connectApi'

export interface InstitutionRequest extends Request {
  connectApi: ConnectApi
}

export const getInstitutionHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  if (req.context?.provider) {
    const institution = await req.connectApi.loadInstitutionByAggregatorId(
      req.params.institution_guid
    )

    res.send(institution)

    return
  }

  const ret = await req.connectApi.loadInstitutionByUcpId(
    req.params.institution_guid
  )
  res.send(ret)
}

export interface GetInstitutionsRequest extends InstitutionRequest {
  context: {
    job_type: MappedJobTypes
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
  const popularInstitutions = await req.connectApi.loadPopularInstitutions()
  res.send(popularInstitutions)
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
  const credentials = await req.connectApi.getInstitutionCredentials(
    req.params.institution_guid
  )
  res.send(credentials)
}
