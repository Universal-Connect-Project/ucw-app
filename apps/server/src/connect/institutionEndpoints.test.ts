import type { Response } from 'express'
import {
  elasticSearchInstitutionData,
  institutionData
} from '../test/testData/institution'
import { ConnectApi } from './connectApi'
import type { InstitutionRequest } from './institutionEndpoints'
import { getInstitutionHandler } from './institutionEndpoints'

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
})
