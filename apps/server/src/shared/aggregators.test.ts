import type {
  CachedInstitution} from './contract';
import {
  JobTypeSupports,
  MappedJobTypes,
  Aggregators
} from './contract'
import { getAvailableAggregators } from '../shared/aggregators'

const institutionAggregatorsSupportEverything: CachedInstitution = {
  url: 'testUrl',
  id: 'testId',
  logo: '',
  is_test_bank: false,
  routing_numbers: [],
  name: 'test',
  keywords: null,
  mx: {
    id: 'mx',
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true
  },
  sophtron: {
    id: 'sophtron',
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true
  }
}

const allAggregators = [Aggregators.MX, Aggregators.SOPHTRON]

const filterOutAggregator = (aggregator: Aggregators) =>
  allAggregators.filter((currentAggregator) => currentAggregator !== aggregator)

const generateAggregatorTests = (aggregator: Aggregators) =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  describe(`getAvailableAggregators tests for aggregator: ${aggregator}`, () => {
    it(`doesnt return ${aggregator} if it's not in the supported aggregators`, () => {
      const aggregatorsWithoutCurrentAggregator = filterOutAggregator(aggregator)

      expect(
        getAvailableAggregators({
          institution: institutionAggregatorsSupportEverything,
          jobType: MappedJobTypes.AGGREGATE,
          shouldRequireFullSupport: false,
          supportedAggregators: aggregatorsWithoutCurrentAggregator
        })
      ).toEqual(aggregatorsWithoutCurrentAggregator)
    })

    it(`doesnt return ${aggregator} if it's not in the institution`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          jobType: MappedJobTypes.AGGREGATE,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })

    it(`doesnt return ${aggregator} if job type is all and supports_verification is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              supports_verification: false
            }
          },
          jobType: MappedJobTypes.ALL,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })

    it(`doesnt return ${aggregator} if job type is all and supports_identification is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              supports_identification: false
            }
          },
          jobType: MappedJobTypes.ALL,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })

    it(`doesnt return ${aggregator} if job type is verification and supports_verification is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              supports_verification: false
            }
          },
          jobType: MappedJobTypes.VERIFICATION,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })

    it(`doesnt return ${aggregator} if job type is identity and supports_identity is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              supports_identification: false
            }
          },
          jobType: MappedJobTypes.IDENTITY,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })

    it(`returns ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is false`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: false
            }
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators
        })
      ).toEqual(allAggregators)
    })

    it(`returns ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is true, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: true
            }
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: true,
          supportedAggregators: allAggregators
        })
      ).toEqual(allAggregators)
    })

    it(`doesnt return ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: false
            }
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: true,
          supportedAggregators: allAggregators
        })
      ).toEqual(filterOutAggregator(aggregator))
    })
  })

describe('aggregators', () => {
  describe('getAvailableAggregators', () => {
    it('returns all the aggregators if they support each of the job types', () => {
      Object.values(MappedJobTypes).forEach((mappedJobType) => {
        expect(
          getAvailableAggregators({
            institution: institutionAggregatorsSupportEverything,
            jobType: mappedJobType,
            shouldRequireFullSupport: true,
            supportedAggregators: allAggregators
          })
        ).toEqual(allAggregators)
      })
    })

    generateAggregatorTests(Aggregators.MX)

    generateAggregatorTests(Aggregators.SOPHTRON)
  })
})
