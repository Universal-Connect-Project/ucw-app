import { MappedJobTypes, type InstitutionProvider } from '../shared/contract'
import testPreferences from '../../cachedDefaults/testData/testPreferences.json'
import * as preferences from '../shared/preferences'
import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock } from './ElasticSearchClient'
import { resolveInstitutionProvider } from './institutionResolver'

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
            id: 'mx_id',
            supports_aggregation: true
          },
          sophtron: {
            id: 'sophtron_bank',
            supports_aggregation: true
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
            id: 'mx_id',
            supports_aggregation: true
          },
          sophtron: {
            id: null
          }
        }
      }
    }
  )
}

const mockInstitutionForJobTypes = (
  institutionId = 'test',
  mxAttrs: InstitutionProvider,
  sophtronAttrs: InstitutionProvider
) => {
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
          mx: mxAttrs,
          sophtron: sophtronAttrs
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

  describe('resolveInstitutionProvider', () => {
    beforeEach(() => {
      ElasticSearchMock.clearAll()
    })

    it('resolves to mx_int if its a test bank and mx is the provider', async () => {
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

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
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
                id: 'sophtron_bank',
                supports_aggregation: true
              }
            }
          }
        }
      )

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual('sophtron')
    })

    it('resolves to mx if its the only option', async () => {
      mockInstitutionWithMx('test')

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
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
        (
          await resolveInstitutionProvider(
            institutionId,
            MappedJobTypes.AGGREGATE
          )
        ).provider
      ).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.71)

      expect(
        (
          await resolveInstitutionProvider(
            institutionId,
            MappedJobTypes.AGGREGATE
          )
        ).provider
      ).toEqual('sophtron')
    })

    it('routes using default volume', async () => {
      mockInstitutionWithMxAndSophtron()

      expect(testPreferences.defaultProviderVolume).toEqual({
        mx: 50,
        sophtron: 50
      })

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.51)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('sophtron')
    })

    it('routes using default provider', async () => {
      mockInstitutionWithMxAndSophtron()

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: 'mx'
      })

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('mx')

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: 'sophtron'
      })

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('sophtron')
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

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('mx')
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

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('mx')
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

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('mx')

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual('sophtron')
    })

    it('returns undefined if mx is the only option but sophtron is the only supported provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: ['sophtron']
      })

      mockInstitutionWithMx()

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual(undefined)
    })

    it('returns a provider if that provider is the only supported provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: ['mx']
      })

      mockInstitutionWithMxAndSophtron()

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual('mx')

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: ['sophtron']
      })

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution2.provider).toEqual('sophtron')
    })

    it('returns "mx" for job types where sophtron doesnt support the job type', async () => {
      mockInstitutionForJobTypes(
        'test',
        {
          id: 'mx_bank',
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true
        },
        {
          id: 'sophtron_bank',
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false
        }
      )

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.IDENTITY
      )
      expect(institution.provider).toEqual('mx')

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.VERIFICATION
      )
      expect(institution2.provider).toEqual('mx')

      const institution3 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.ALL
      )
      expect(institution3.provider).toEqual('mx')
    })

    it('returns "sophtron" for job types where mx doesnt support the job type', async () => {
      mockInstitutionForJobTypes(
        'test',
        {
          id: 'mx_bank',
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false
        },
        {
          id: 'sophtron_bank',
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true
        }
      )

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.IDENTITY
      )
      expect(institution.provider).toEqual('sophtron')

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.VERIFICATION
      )
      expect(institution2.provider).toEqual('sophtron')

      const institution3 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.ALL
      )
      expect(institution3.provider).toEqual('sophtron')
    })
  })
})
