import type { Response } from 'express'
import {
  elasticSearchInstitutionData,
  institutionData,
  transformedInstitutionList,
  transformedPopularInstitutionsList
} from '../test/testData/institution'
import { ConnectApi } from './connectApi'
import type {
  GetInstitutionsRequest,
  InstitutionRequest
} from './institutionEndpoints'
import {
  favoriteInstitutionsHandler,
  getInstitutionHandler,
  getInstitutionsHandler
} from './institutionEndpoints'
import { MappedJobTypes } from '../shared/contract'

const mxInstitution = institutionData.institution

describe('institutionEndpoints', () => {
  describe('getInstitutionHandler', () => {
    it('returns the institution by the provider id if it has a provider', async () => {
      const context = {
        provider: 'mx'
      }

      const req = {
        connectService: new ConnectApi({ context }),
        context,
        params: {
          institution_guid: 'testProviderInstitutionGuid'
        }
      } as unknown as InstitutionRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await getInstitutionHandler(req, res)

      expect(res.send).toHaveBeenCalledWith({
        institution: {
          code: mxInstitution.code,
          credentials: [],
          guid: mxInstitution.code,
          instructional_data: {},
          logo_url: mxInstitution.medium_logo_url,
          name: mxInstitution.name,
          provider: 'mx',
          providers: undefined,
          supports_oauth: mxInstitution.supports_oauth,
          url: mxInstitution.url
        }
      })
    })

    it("returns the institution by the ucp id if it doesn't have a provider", async () => {
      const context = {
        job_type: 'aggregate'
      }
      const req = {
        connectService: new ConnectApi({ context }),
        context,
        params: {
          institution_guid: 'testProviderInstitutionGuid'
        }
      } as unknown as InstitutionRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await getInstitutionHandler(req, res)

      const ucpInstitution = elasticSearchInstitutionData

      expect(res.send).toHaveBeenCalledWith({
        institution: {
          code: mxInstitution.code,
          credentials: [],
          guid: mxInstitution.code,
          instructional_data: {},
          logo_url: ucpInstitution.logo,
          name: ucpInstitution.name,
          provider: 'mx_int',
          providers: undefined,
          supports_oauth: ucpInstitution.mx.supports_oauth,
          url: ucpInstitution.url
        }
      })
    })
  })

  describe('getInstitutionsHandler', () => {
    it('returns a list of institutions', async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE
      }

      const req = {
        connectService: new ConnectApi({ context }),
        context,
        query: {
          search_name: 'MX'
        }
      } as unknown as GetInstitutionsRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await getInstitutionsHandler(req, res)

      expect(res.send).toHaveBeenCalledWith(transformedInstitutionList)
    })
  })

  describe('favoriteInstitutionsHandler', () => {
    it('returns a list of favorite institutions', async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE
      }

      const req = {
        connectService: new ConnectApi({ context }),
        context
      } as unknown as InstitutionRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await favoriteInstitutionsHandler(req, res)

      expect(res.send).toHaveBeenCalledWith(transformedPopularInstitutionsList)
    })
  })
})
