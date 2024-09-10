import { MappedJobTypes } from '../shared/contract'
import { MxAdapter } from '../adapters/mx'
import {
  elasticSearchInstitutionData,
  transformedInstitutionList,
  transformedPopularInstitutionsList
} from '../test/testData/institution'
import { ConnectApi } from './connectApi'
import { TEST_EXAMPLE_A_PROVIDER_STRING } from '../test-adapter'
import {
  TEST_EXAMPLE_B_PROVIDER_STRING,
  testExampleInstitution
} from '../test-adapter/constants'
import * as preferences from '../shared/preferences'
import testPreferences from '../../cachedDefaults/testData/testPreferences.json'

const connectApi = new ConnectApi({
  context: {
    provider: TEST_EXAMPLE_A_PROVIDER_STRING,
    updated: false,
    institution_id: 'xxx',
    resolved_user_id: null,
    job_type: 'aggregate'
  }
})

const isIntEnv = false
const mxApiClient = new MxAdapter(isIntEnv)

connectApi.providerAdapter = mxApiClient

describe('connectApi', () => {
  describe('loadInstitutionByProviderId', () => {
    it('returns the institution', async () => {
      const testId = 'testId'

      const response = await connectApi.loadInstitutionByProviderId(testId)

      expect(response).toEqual({
        institution: {
          code: testId,
          credentials: [],
          guid: testId,
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
  })

  describe('loadInstitutions', () => {
    it('loads formatted institutions', async () => {
      const institutions = await connectApi.loadInstitutions(
        'MX',
        MappedJobTypes.AGGREGATE
      )

      expect(institutions).toEqual(transformedInstitutionList)
    })
  })

  describe('loadInstitutionByUcpId', () => {
    const expectedInstitutionResponse = {
      institution: {
        guid: elasticSearchInstitutionData[TEST_EXAMPLE_B_PROVIDER_STRING].id,
        code: elasticSearchInstitutionData[TEST_EXAMPLE_B_PROVIDER_STRING].id,
        name: elasticSearchInstitutionData.name,
        url: elasticSearchInstitutionData.url,
        logo_url: elasticSearchInstitutionData.logo,
        instructional_data: {},
        credentials: [] as any[],
        supports_oauth: false,
        providers: undefined as any,
        provider: TEST_EXAMPLE_B_PROVIDER_STRING
      }
    }

    it('finds the institution', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: TEST_EXAMPLE_B_PROVIDER_STRING
      })

      const institution = await connectApi.loadInstitutionByUcpId('UCP-1234')
      expect(institution).toEqual(expectedInstitutionResponse)
    })
  })

  describe('loadPopularInstitutions', () => {
    it('gets the popular institution list', async () => {
      connectApi.providerAdapter = mxApiClient

      const popularInstitutionList = await connectApi.loadPopularInstitutions()

      expect(popularInstitutionList).toEqual(transformedPopularInstitutionsList)
    })
  })
})
