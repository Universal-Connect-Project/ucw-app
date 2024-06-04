import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock } from '../utils/ElasticSearchClient'
import {
  getAvailableProviders,
  resolveInstitutionProvider
} from './institutionResolver'

describe('institutionResolver', () => {
  describe('getAvailableProviders', () => {
    it('gets mx and sophtron providers', () => {
      const expectedProviders = ['mx', 'sophtron']
      const institution = {
        ...elasticSearchInstitutionData,
        mx: {
          ...elasticSearchInstitutionData.mx,
          id: 'mx_bank'
        },
        sophtron: {
          ...elasticSearchInstitutionData.sophtron,
          id: 'sophtron_bank'
        }
      }

      expect(getAvailableProviders(institution)).toEqual(expectedProviders)
    })

    // This is temporary until we fully support finicity and akoya
    it('only returns mx and sophtron even if finbank and akoya are configured', () => {
      const institution = {
        ...elasticSearchInstitutionData,
        mx: {
          ...elasticSearchInstitutionData.mx,
          id: 'mx_bank'
        },
        sophtron: {
          ...elasticSearchInstitutionData.sophtron,
          id: 'sophtron_bank'
        },
        finicity: {
          ...elasticSearchInstitutionData.finicity,
          id: 'finicity_bank'
        },
        akoya: {
          ...elasticSearchInstitutionData.akoya,
          id: 'akoya_bank'
        }
      }
      const expectedProviders = ['mx', 'sophtron']

      expect(getAvailableProviders(institution)).toEqual(expectedProviders)
    })

    it('gets mx provider', () => {
      const institution = elasticSearchInstitutionData
      const expectedProviders = ['mx']

      expect(getAvailableProviders(institution)).toEqual(expectedProviders)
    })
  })

  describe('resolveInstitutionProvider', () => {
    beforeEach(() => {
      ElasticSearchMock.clearAll()
    })

    it("resolves to mx if it's the only option", async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: elasticSearchInstitutionData
          }
        }
      )

      const institution = await resolveInstitutionProvider('test')
      expect(institution.provider).toEqual('mx_int')
    })

    it("resolves to sophtron if it's the only option", async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              mx: {
                id: null
              },
              sophtron: {
                id: 'sophtron_bank'
              }
            }
          }
        }
      )

      const institution = await resolveInstitutionProvider('test')
      expect(institution.provider).toEqual('sophtron')
    })

    it('resolves to mx_int if its a test bank and mx is the provider', async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              is_test_bank: false
            }
          }
        }
      )

      const institution = await resolveInstitutionProvider('test')
      expect(institution.provider).toEqual('mx')
    })

    it('routes using institution specific volume', () => {})

    it('routes using default volume', () => {})

    it('routes using default provider', () => {})

    it('falls back to default volume if institution specific volume doesnt have an available provider', () => {})

    it('falls back to default provider if institution specific and default volume dont have an available provider', () => {})

    it('chooses a random available provider if institution specific, default volume, and default provider dont have an available provider', () => {})
  })
})
