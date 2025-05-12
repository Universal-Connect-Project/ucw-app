import { getAvailableAggregators } from "../shared/aggregators";
import type { Aggregator } from "./contract";
import { Aggregators, JobTypeSupports } from "./contract";
import { type CachedInstitution, ComboJobTypes } from "@repo/utils";

const institutionAggregatorsSupportEverything: CachedInstitution = {
  url: "testUrl",
  id: "testId",
  logo: "",
  is_test_bank: false,
  routing_numbers: [],
  name: "test",
  keywords: null,
  testExampleA: {
    id: "testExampleA",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true,
  },
  testExampleB: {
    id: "testExampleB",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true,
  },
  testExampleC: {
    id: "testExampleC",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true,
  },
};

const allAggregators = [
  Aggregators.TEST_A,
  Aggregators.TEST_B,
  Aggregators.TEST_C,
];

const filterOutAggregator = (aggregator: Aggregators): Aggregators[] =>
  allAggregators.filter(
    (currentAggregator) => currentAggregator !== aggregator,
  );

const generateAggregatorTests = (aggregator: Aggregators) =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  describe(`getAvailableAggregators tests for aggregator: ${aggregator}`, () => {
    it(`doesnt return ${aggregator} if it's not in the supported aggregators`, () => {
      const aggregatorsWithoutCurrentAggregator =
        filterOutAggregator(aggregator);

      expect(
        getAvailableAggregators({
          institution: institutionAggregatorsSupportEverything,
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          shouldRequireFullSupport: false,
          supportedAggregators:
            aggregatorsWithoutCurrentAggregator as Aggregator[],
        }),
      ).toEqual(aggregatorsWithoutCurrentAggregator);
    });

    it(`doesnt return ${aggregator} if it's not in the institution`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          jobTypes: [ComboJobTypes.TRANSACTIONS],
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(filterOutAggregator(aggregator));
    });

    it(`doesnt return ${aggregator} if job type has multiple and includes ${ComboJobTypes.ACCOUNT_NUMBER} and supports_verification is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              supports_verification: false,
            },
          },
          jobTypes: [ComboJobTypes.TRANSACTIONS, ComboJobTypes.ACCOUNT_NUMBER],
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(filterOutAggregator(aggregator));
    });

    it(`doesnt return ${aggregator} if job type is verification and supports_verification is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              supports_verification: false,
            },
          },
          jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(filterOutAggregator(aggregator));
    });

    it(`doesnt return ${aggregator} if job type is identity and supports_identity is falsy`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              supports_identification: false,
            },
          },
          jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(filterOutAggregator(aggregator));
    });

    it(`returns ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is false`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              [JobTypeSupports.FULLHISTORY]: false,
            },
          },
          jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
          shouldRequireFullSupport: false,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(allAggregators);
    });

    it(`returns ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is true, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              [JobTypeSupports.FULLHISTORY]: true,
            },
          },
          jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
          shouldRequireFullSupport: true,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(allAggregators);
    });

    it(`doesnt return ${aggregator} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableAggregators({
          institution: {
            ...institutionAggregatorsSupportEverything,
            [aggregator]: {
              ...institutionAggregatorsSupportEverything[aggregator],
              [JobTypeSupports.FULLHISTORY]: false,
            },
          },
          jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
          shouldRequireFullSupport: true,
          supportedAggregators: allAggregators as Aggregator[],
        }),
      ).toEqual(filterOutAggregator(aggregator));
    });
  });

describe("aggregators", () => {
  describe("getAvailableAggregators", () => {
    it("returns all the aggregators if they support each of the job types", () => {
      Object.values(ComboJobTypes).forEach((comboJobType) => {
        expect(
          getAvailableAggregators({
            institution: institutionAggregatorsSupportEverything,
            jobTypes: [comboJobType],
            shouldRequireFullSupport: true,
            supportedAggregators: allAggregators as Aggregator[],
          }),
        ).toEqual(allAggregators);
      });
    });

    generateAggregatorTests(Aggregators.TEST_A);
    generateAggregatorTests(Aggregators.TEST_B);
    generateAggregatorTests(Aggregators.TEST_C);
  });
});
