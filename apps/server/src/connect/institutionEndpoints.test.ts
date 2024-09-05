import type { Response } from 'express'
import { MappedJobTypes } from '../shared/contract'
import {
  elasticSearchInstitutionData,
  transformedInstitutionList,
  transformedPopularInstitutionsList
} from '../test/testData/institution'
import { ConnectApi } from './connectApi'
import type {
  GetInstitutionCredentialsRequest,
  GetInstitutionsRequest,
  InstitutionRequest
} from './institutionEndpoints'
import {
  favoriteInstitutionsHandler,
  getInstitutionCredentialsHandler,
  getInstitutionHandler,
  getInstitutionsHandler
} from './institutionEndpoints'
import { TEST_EXAMPLE_A_PROVIDER_STRING } from '../test-adapter'
import {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_PROVIDER_STRING,
  testExampleCredentials,
  testExampleInstitution
} from '../test-adapter/constants'
import * as preferences from '../shared/preferences'
import testPreferences from '../../cachedDefaults/testData/testPreferences.json'

describe('institutionEndpoints', () => {
  describe('getInstitutionHandler', () => {
    it('returns the institution by the provider id if it has a provider', async () => {
      const context = {
        provider: TEST_EXAMPLE_A_PROVIDER_STRING
      }

      const req = {
        connectApi: new ConnectApi({ context }),
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
          code: 'testProviderInstitutionGuid',
          credentials: [],
          guid: 'testProviderInstitutionGuid',
          instructional_data: {},
          logo_url: testExampleInstitution.logo_url,
          name: testExampleInstitution.name,
          provider: TEST_EXAMPLE_A_PROVIDER_STRING,
          providers: undefined,
          supports_oauth: testExampleInstitution.oauth,
          url: testExampleInstitution.url
        }
      })
    })

    it("returns the institution by the ucp id if it doesn't have a provider", async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...testPreferences,
        supportedProviders: [TEST_EXAMPLE_B_PROVIDER_STRING]
      } as any)

      const context = {
        job_type: 'aggregate'
      }
      const req = {
        connectApi: new ConnectApi({ context }),
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
      const ucpTestExampleInstitution =
        ucpInstitution[TEST_EXAMPLE_B_PROVIDER_STRING]

      expect(res.send).toHaveBeenCalledWith({
        institution: {
          code: ucpTestExampleInstitution.id,
          credentials: [],
          guid: ucpTestExampleInstitution.id,
          instructional_data: {},
          logo_url: ucpInstitution.logo,
          name: ucpInstitution.name,
          provider: TEST_EXAMPLE_B_PROVIDER_STRING,
          providers: undefined,
          supports_oauth: testExampleInstitution.oauth,
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
        connectApi: new ConnectApi({ context }),
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

    it('returns institutions when searching by routing number', async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE
      }

      const req = {
        connectApi: new ConnectApi({ context }),
        context,
        query: {
          routing_number: '1234567'
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
        connectApi: new ConnectApi({ context }),
        context
      } as unknown as InstitutionRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await favoriteInstitutionsHandler(req, res)

      expect(res.send).toHaveBeenCalledWith(transformedPopularInstitutionsList)
    })
  })

  describe('getInstitutionCredentialsHandler', () => {
    it('returns with the institution credentials', async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE,
        provider: TEST_EXAMPLE_A_PROVIDER_STRING
      }

      const connectApi = new ConnectApi({ context })

      await connectApi.init()

      const req = {
        connectApi,
        context,
        params: {
          institution_guid: 'test'
        }
      } as unknown as GetInstitutionCredentialsRequest

      const res = {
        send: jest.fn()
      } as unknown as Response

      await getInstitutionCredentialsHandler(req, res)

      expect(res.send).toHaveBeenCalledWith({
        credentials: [
          {
            field_name: testExampleCredentials.field_name,
            field_type: 3,
            guid: testExampleCredentials.id,
            id: testExampleCredentials.id,
            label: TEST_EXAMPLE_A_LABEL_TEXT
          }
        ]
      })
    })
  })
})
