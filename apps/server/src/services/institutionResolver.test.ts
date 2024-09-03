import testPreferences from '../../cachedDefaults/testData/testPreferences.json'
import {
  JobTypeSupports,
  MappedJobTypes,
  type InstitutionProvider
} from '../shared/contract'
import * as preferences from '../shared/preferences'
import { ElasticSearchMock } from '../test/elasticSearchMock'
import { elasticSearchInstitutionData } from '../test/testData/institution'
import { resolveInstitutionProvider } from './institutionResolver'
import {
  TEST_EXAMPLE_A_PROVIDER_STRING,
  TEST_EXAMPLE_B_PROVIDER_STRING,
  TEST_EXAMPLE_C_PROVIDER_STRING
} from '../test-adapter'

const mockInstitutionWithAAndB = (institutionId = 'test') => {
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
          [TEST_EXAMPLE_A_PROVIDER_STRING]: {
            id: 'mx_id',
            supports_aggregation: true
          },
          [TEST_EXAMPLE_B_PROVIDER_STRING]: {
            id: 'sophtron_bank',
            supports_aggregation: true
          }
        }
      }
    }
  )
}

const mockInstitutionWithA = (
  institutionId = 'test',
  institutionProps?: any
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
          [TEST_EXAMPLE_A_PROVIDER_STRING]: {
            id: 'a_id',
            supports_aggregation: true
          },
          [TEST_EXAMPLE_B_PROVIDER_STRING]: {
            id: null
          },
          ...institutionProps
        }
      }
    }
  )
}

const mockInstitutionForJobTypes = (
  institutionId = 'test',
  testExampleAAttrs: InstitutionProvider,
  testExampleBAttrs: InstitutionProvider
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
          [TEST_EXAMPLE_A_PROVIDER_STRING]: testExampleAAttrs,
          [TEST_EXAMPLE_B_PROVIDER_STRING]: testExampleBAttrs
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

    it(`resolves to ${TEST_EXAMPLE_C_PROVIDER_STRING} if its a test bank and ${TEST_EXAMPLE_A_PROVIDER_STRING} is the provider`, async () => {
      mockInstitutionWithA(undefined, {
        is_test_bank: true
      })

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual(TEST_EXAMPLE_C_PROVIDER_STRING)
    })

    it(`resolves to ${TEST_EXAMPLE_B_PROVIDER_STRING} if it's the only option`, async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_PROVIDER_STRING]: {
                id: null
              },
              [TEST_EXAMPLE_B_PROVIDER_STRING]: {
                id: 'bBank',
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
      expect(institution.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it(`resolves to ${TEST_EXAMPLE_A_PROVIDER_STRING} if its the only option`, async () => {
      mockInstitutionWithA('test')

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)
    })

    it(`resolves to ${TEST_EXAMPLE_B_PROVIDER_STRING} if it supports history and ${TEST_EXAMPLE_A_PROVIDER_STRING} doesnt`, async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_PROVIDER_STRING]: {
                id: 'aBank',
                [JobTypeSupports.AGGREGATE]: true
              },
              [TEST_EXAMPLE_B_PROVIDER_STRING]: {
                id: 'bBank',
                [JobTypeSupports.AGGREGATE]: true,
                [JobTypeSupports.FULLHISTORY]: true
              }
            }
          }
        }
      )

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.FULLHISTORY
      )
      expect(institution.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it(`resolves to ${TEST_EXAMPLE_B_PROVIDER_STRING} if it doesnt support history, but it does support aggregation, and nothing else supports fullhistory`, async () => {
      ElasticSearchMock.add(
        {
          method: 'GET',
          path: '/institutions/_doc/test'
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_PROVIDER_STRING]: {
                id: null
              },
              [TEST_EXAMPLE_B_PROVIDER_STRING]: {
                id: 'b_bank',
                [JobTypeSupports.AGGREGATE]: true
              }
            }
          }
        }
      )

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.FULLHISTORY
      )
      expect(institution.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it('routes using institution specific volume', async () => {
      const firstInstitutionWithVolumeControl = Object.entries(
        testPreferences.institutionProviderVolumeMap
      )[0]

      const [institutionId, volumeMap] = firstInstitutionWithVolumeControl

      expect(volumeMap).toEqual({
        [TEST_EXAMPLE_A_PROVIDER_STRING]: 70,
        [TEST_EXAMPLE_B_PROVIDER_STRING]: 30
      })

      mockInstitutionWithAAndB(institutionId)

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.7)

      expect(
        (
          await resolveInstitutionProvider(
            institutionId,
            MappedJobTypes.AGGREGATE
          )
        ).provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.71)

      expect(
        (
          await resolveInstitutionProvider(
            institutionId,
            MappedJobTypes.AGGREGATE
          )
        ).provider
      ).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it('routes using default volume', async () => {
      mockInstitutionWithAAndB()

      expect(testPreferences.defaultProviderVolume).toEqual({
        [TEST_EXAMPLE_A_PROVIDER_STRING]: 50,
        [TEST_EXAMPLE_B_PROVIDER_STRING]: 50
      })

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.51)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it('routes using default provider', async () => {
      mockInstitutionWithAAndB()

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: TEST_EXAMPLE_A_PROVIDER_STRING
      })

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: TEST_EXAMPLE_B_PROVIDER_STRING
      })

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it('falls back to default volume if institution specific volume doesnt have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: {
          test: {
            [TEST_EXAMPLE_B_PROVIDER_STRING]: 100
          }
        },
        defaultProviderVolume: {
          [TEST_EXAMPLE_A_PROVIDER_STRING]: 100
        },
        defaultProvider: undefined
      })

      mockInstitutionWithA()

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)
    })

    it('falls back to default provider if institution specific and default volume dont have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: {
          test: {
            [TEST_EXAMPLE_B_PROVIDER_STRING]: 100
          }
        },
        defaultProviderVolume: {
          [TEST_EXAMPLE_B_PROVIDER_STRING]: 100
        },
        defaultProvider: TEST_EXAMPLE_A_PROVIDER_STRING
      })

      mockInstitutionWithA()

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)
    })

    it('chooses a random available provider if institution specific, default volume, and default provider dont have an available provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionProviderVolumeMap: undefined,
        defaultProviderVolume: undefined,
        defaultProvider: undefined
      })

      mockInstitutionWithAAndB()

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.49)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      jest.spyOn(global.Math, 'random').mockReturnValueOnce(0.5)

      expect(
        (await resolveInstitutionProvider('test', MappedJobTypes.AGGREGATE))
          .provider
      ).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it(`returns undefined if ${TEST_EXAMPLE_A_PROVIDER_STRING} is the only option but ${TEST_EXAMPLE_B_PROVIDER_STRING} is the only supported provider`, async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: [TEST_EXAMPLE_B_PROVIDER_STRING]
      })

      mockInstitutionWithA()

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual(undefined)
    })

    it('returns a provider if that provider is the only supported provider', async () => {
      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: [TEST_EXAMPLE_A_PROVIDER_STRING]
      })

      mockInstitutionWithAAndB()

      const institution = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution.provider).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      jest.spyOn(preferences, 'getPreferences').mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedProviders: [TEST_EXAMPLE_B_PROVIDER_STRING]
      })

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.AGGREGATE
      )
      expect(institution2.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })

    it(`returns ${TEST_EXAMPLE_A_PROVIDER_STRING} for job types where ${TEST_EXAMPLE_B_PROVIDER_STRING} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes(
        'test',
        {
          id: 'testABank',
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true
        },
        {
          id: 'testBBank',
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
      expect(institution.provider).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.VERIFICATION
      )
      expect(institution2.provider).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)

      const institution3 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.ALL
      )
      expect(institution3.provider).toEqual(TEST_EXAMPLE_A_PROVIDER_STRING)
    })

    it(`returns ${TEST_EXAMPLE_B_PROVIDER_STRING} for job types where ${TEST_EXAMPLE_A_PROVIDER_STRING} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes(
        'test',
        {
          id: 'testABank',
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false
        },
        {
          id: 'testBBank',
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
      expect(institution.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)

      const institution2 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.VERIFICATION
      )
      expect(institution2.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)

      const institution3 = await resolveInstitutionProvider(
        'test',
        MappedJobTypes.ALL
      )
      expect(institution3.provider).toEqual(TEST_EXAMPLE_B_PROVIDER_STRING)
    })
  })
})
