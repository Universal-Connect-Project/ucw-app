import { MxAdapter } from '../adapters/mx'
import { institutionData } from '../test/testData/institution'
import { ConnectApi } from './connectApi'

const connectApi = new ConnectApi({
  context: {
    provider: 'mx',
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
      const mxInstitution = institutionData.institution

      const response = await connectApi.loadInstitutionByProviderId('testId')

      expect(response).toEqual({
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
  })

  describe('loadInstitutions', () => {
    const expectedInstitutionList = [
      {
        guid: 'UCP-da107e6d0da7779',
        name: 'MX Bank (Oauth)',
        url: 'https://mx.com',
        logo_url:
          'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
        supports_oauth: true
      },
      {
        guid: 'UCP-da107e6d0da7779',
        name: 'MX Bank (Oauth)',
        url: 'https://mx.com',
        logo_url:
          'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
        supports_oauth: true
      }
    ]

    it('loads formatted institutions', async () => {
      const institutions = await connectApi.loadInstitutions('MX', 'aggregate')

      expect(institutions).toEqual(expectedInstitutionList)
    })
  })

  describe('loadInstitutionByUcpId', () => {
    const expectedInstitutionResponse = {
      institution: {
        guid: 'testCode',
        code: 'testCode',
        name: 'MX Bank (Oauth)',
        url: 'https://mx.com',
        logo_url:
          'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
        instructional_data: {},
        credentials: [] as any[],
        supports_oauth: true,
        providers: undefined as any,
        provider: 'mx_int'
      }
    }

    it('finds the institution', async () => {
      const institution = await connectApi.loadInstitutionByUcpId('UCP-1234')
      expect(institution).toEqual(expectedInstitutionResponse)
    })
  })

  describe('loadPopularInstitutions', () => {
    const expectedPopularInstitutionResponse = [
      {
        guid: 'UCP-da107e6d0da7779',
        name: 'MX Bank (Oauth)',
        url: 'https://mx.com',
        logo_url:
          'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
        supports_oauth: true
      }
    ]

    it('gets the popular institution list', async () => {
      connectApi.providerAdapter = mxApiClient

      const popularInstitutionList = await connectApi.loadPopularInstitutions()

      expect(popularInstitutionList).toEqual(expectedPopularInstitutionResponse)
    })
  })
})
