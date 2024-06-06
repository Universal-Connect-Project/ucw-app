import * as preferences from '../shared/preferences'
import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock } from '../utils/ElasticSearchClient'
import {
  getAvailableProviders,
  resolveInstitutionProvider
} from './institutionResolver'
import testPreferences from '../../cachedDefaults/testData/testPreferences.json'

const mockInstitutionWithMxAndSophtron = (institutionId = 'test') => {
  ElasticSearchMock.add(
    {
      method: 'GET',
      path: `/institutions/_doc/${institutionId}`
    },
    () => {
      return {
        _source: {
          ...elasticSearchInstitutionData,
          is_test_bank: false,
          mx: {
            id: 'mx_id'
          },
          sophtron: {
            id: 'sophtron_bank'
          }
        }
      }
    }
  )
}

const mockInstitutionWithMx = (institutionId = 'test') => {
  ElasticSearchMock.add(
    {
      method: 'GET',
      path: `/institutions/_doc/${institutionId}`
    },
    () => {
      return {
        _source: {
          ...elasticSearchInstitutionData,
          is_test_bank: false,
          mx: {
            id: 'mx_id'
          },
          sophtron: {
            id: null
          }
        }
      }
    }
  )
}

describe('institutionResolver', () => {
  beforeEach(() => {
    jest
      .spyOn(preferences, 'getPreferences')
      .mockResolvedValue(testPreferences as preferences.Preferences)
  })

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

    it('routes using institution specific volume', async () => {
      const firstInstitutionWithVolumeControl = Object.entries(
        testPreferences.institutionProviderVolumeMap
      )[0]

      const [institutionId, volumeMap] = firstInstitutionWithVolumeControl

      expect(volumeMap).toEqual({
        mx: 70,
        sophtron: 30
      })

      mockInstitutionWithMxAndSophtron(institutionId)

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.7)

      expect(
        (await resolveInstitutionProvider(institutionId)).provider
      ).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.71)

      expect(
        (await resolveInstitutionProvider(institutionId)).provider
      ).toEqual('sophtron')
    })

    it('routes using default volume', async () => {
      mockInstitutionWithMxAndSophtron()

      expect(testPreferences.defaultProviderVolume).toEqual({
        mx: 50,
        sophtron: 50
      })

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect((await resolveInstitutionProvider('test')).provider).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.51)

      expect((await resolveInstitutionProvider('test')).provider).toEqual(
        'sophtron'
      )
    })

    it('routes using default provider', async () => {
      mockInstitutionWithMxAndSophtron()

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: 'mx'
      })

      expect((await resolveInstitutionProvider('test')).provider).toEqual('mx')

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: 'sophtron'
      })

      expect((await resolveInstitutionProvider('test')).provider).toEqual(
        'sophtron'
      )
    })

    it('falls back to default volume if institution specific volume doesnt have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: {
          test: {
            sophtron: 100
          }
        },
        defaultProviderVolume: {
          mx: 100
        },
        defaultProvider: undefined
      })

      mockInstitutionWithMx()

      expect((await resolveInstitutionProvider('test')).provider).toEqual('mx')
    })

    it('falls back to default provider if institution specific and default volume dont have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: {
          test: {
            sophtron: 100
          }
        },
        defaultProviderVolume: {
          sophtron: 100
        },
        defaultProvider: 'mx'
      })

      mockInstitutionWithMx()

      expect((await resolveInstitutionProvider('test')).provider).toEqual('mx')
    })

    it('chooses a random available provider if institution specific, default volume, and default provider dont have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: undefined
      })

      mockInstitutionWithMxAndSophtron()

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.49)

      expect((await resolveInstitutionProvider('test')).provider).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect((await resolveInstitutionProvider('test')).provider).toEqual(
        'sophtron'
      )
    })
  })
})
