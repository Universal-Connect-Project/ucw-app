import type { Request, Response } from 'express'
import type { MappedJobTypes } from 'src/shared/contract'
import type { ConnectApi } from './connectApi'

export interface InstitutionRequest extends Request {
  connectService: ConnectApi
}

export const getInstitutionHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  if (req.context?.provider) {
    const institution = await req.connectService.loadInstitutionByProviderId(
      req.params.institution_guid
    )

    res.send(institution)

    return
  }

  const ret = await req.connectService.loadInstitutionByUcpId(
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
  const ret = await req.connectService.loadInstitutions(
    req.query.search_name ?? req.query.routing_number,
    req.context.job_type
  )
  res.send(ret)
}

export const favoriteInstitutionsHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  const popularInsitutions = await req.connectService.loadPopularInstitutions()
  res.send(popularInsitutions)
}

export const getInstitutionCredentialsHandler = async (
  req: InstitutionRequest,
  res: Response
) => {
  const credentials = await req.connectService.getInstitutionCredentials(
    req.params.institution_guid
  )
  res.send(credentials)
}
