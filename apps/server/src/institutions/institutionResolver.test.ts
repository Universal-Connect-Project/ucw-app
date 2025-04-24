import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import {
  JobTypeSupports,
  type InstitutionAggregator,
} from "../shared/contract";
import { ComboJobTypes } from "@repo/utils";
import * as preferences from "../shared/preferences";
import { ElasticSearchMock } from "../test/elasticSearchMock";
import { elasticSearchInstitutionData } from "../test/testData/institution";
import { resolveInstitutionAggregator } from "./institutionResolver";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_C_AGGREGATOR_STRING,
} from "../test-adapter";

const mockInstitutionWithAAndB = (institutionId = "test") => {
  ElasticSearchMock.add(
    {
      method: "GET",
      path: `/institutions/_doc/${institutionId}`,
    },
    () => {
      return {
        _source: {
          ...elasticSearchInstitutionData,
          is_test_bank: false,
          [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
            id: "mx_id",
            supports_aggregation: true,
          },
          [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
            id: "sophtron_bank",
            supports_aggregation: true,
          },
        },
      };
    },
  );
};

const mockInstitutionWithA = (
  institutionId = "test",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  institutionProps?: any,
) => {
  ElasticSearchMock.add(
    {
      method: "GET",
      path: `/institutions/_doc/${institutionId}`,
    },
    () => {
      return {
        _source: {
          ...elasticSearchInstitutionData,
          is_test_bank: false,
          [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
            id: "a_id",
            supports_aggregation: true,
          },
          [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
            id: null,
          },
          ...institutionProps,
        },
      };
    },
  );
};

const mockInstitutionForJobTypes = (
  institutionId = "test",
  testExampleAAttrs: InstitutionAggregator,
  testExampleBAttrs: InstitutionAggregator,
) => {
  ElasticSearchMock.add(
    {
      method: "GET",
      path: `/institutions/_doc/${institutionId}`,
    },
    () => {
      return {
        _source: {
          ...elasticSearchInstitutionData,
          is_test_bank: false,
          [TEST_EXAMPLE_A_AGGREGATOR_STRING]: testExampleAAttrs,
          [TEST_EXAMPLE_B_AGGREGATOR_STRING]: testExampleBAttrs,
        },
      };
    },
  );
};

describe("institutionResolver", () => {
  beforeEach(() => {
    jest
      .spyOn(preferences, "getPreferences")
      .mockResolvedValue(testPreferences as preferences.Preferences);
  });

  describe("resolveInstitutionAggregator", () => {
    beforeEach(() => {
      ElasticSearchMock.clearAll();
    });

    it("resolves to the aggregatorOverride with a regular adapter and a non institution", async () => {
      const aggregatorInstitutionId = "testAggregatorInstitutionId";

      const institutionData = {
        ...elasticSearchInstitutionData,
        is_test_bank: false,
      };

      ElasticSearchMock.add(
        {
          method: "GET",
          path: `/institutions/_doc/${aggregatorInstitutionId}`,
        },
        () => {
          return {
            _source: {
              ...institutionData,
              [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                id: aggregatorInstitutionId,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        aggregatorOverride: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        ucpInstitutionId: aggregatorInstitutionId,
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });

      expect(institution).toEqual({
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        id: aggregatorInstitutionId,
        logo_url: institutionData.logo,
        name: institutionData.name,
        url: institutionData.url,
      });
    });

    it("resolves to the aggregatorOverride with a test adapter and a test institution", async () => {
      const aggregatorInstitutionId = "testAggregatorInstitutionId";

      ElasticSearchMock.add(
        {
          method: "GET",
          path: `/institutions/_doc/${aggregatorInstitutionId}`,
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                id: aggregatorInstitutionId,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        aggregatorOverride: TEST_EXAMPLE_C_AGGREGATOR_STRING,
        ucpInstitutionId: aggregatorInstitutionId,
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });

      expect(institution).toEqual({
        aggregator: TEST_EXAMPLE_C_AGGREGATOR_STRING,
        id: aggregatorInstitutionId,
        logo_url: elasticSearchInstitutionData.logo,
        name: elasticSearchInstitutionData.name,
        url: elasticSearchInstitutionData.url,
      });
    });

    it(`resolves to ${TEST_EXAMPLE_C_AGGREGATOR_STRING} if its a test bank and ${TEST_EXAMPLE_A_AGGREGATOR_STRING} is the aggregator`, async () => {
      mockInstitutionWithA(undefined, {
        is_test_bank: true,
      });

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_C_AGGREGATOR_STRING);
    });

    it(`resolves to ${TEST_EXAMPLE_B_AGGREGATOR_STRING} if it's the only option`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                id: null,
              },
              [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
                id: "bBank",
                supports_aggregation: true,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it(`resolves to ${TEST_EXAMPLE_A_AGGREGATOR_STRING} if its the only option`, async () => {
      mockInstitutionWithA("test");

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });

    it(`resolves to ${TEST_EXAMPLE_B_AGGREGATOR_STRING} if it supports history and ${TEST_EXAMPLE_A_AGGREGATOR_STRING} doesnt`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                id: "aBank",
                [JobTypeSupports.AGGREGATE]: true,
              },
              [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
                id: "bBank",
                [JobTypeSupports.AGGREGATE]: true,
                [JobTypeSupports.FULLHISTORY]: true,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it(`resolves to ${TEST_EXAMPLE_B_AGGREGATOR_STRING} if it doesnt support history, but it does support aggregation, and nothing else supports fullhistory`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
                id: null,
              },
              [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
                id: "b_bank",
                [JobTypeSupports.AGGREGATE]: true,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it("routes using institution specific volume", async () => {
      const firstInstitutionWithVolumeControl = Object.entries(
        testPreferences.institutionAggregatorVolumeMap,
      )[0];

      const [institutionId, volumeMap] = firstInstitutionWithVolumeControl;

      expect(volumeMap).toEqual({
        [TEST_EXAMPLE_A_AGGREGATOR_STRING]: 70,
        [TEST_EXAMPLE_B_AGGREGATOR_STRING]: 30,
      });

      mockInstitutionWithAAndB(institutionId);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.7);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: institutionId,
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.71);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: institutionId,
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it("routes using default volume", async () => {
      mockInstitutionWithAAndB();

      expect(testPreferences.defaultAggregatorVolume).toEqual({
        [TEST_EXAMPLE_A_AGGREGATOR_STRING]: 50,
        [TEST_EXAMPLE_B_AGGREGATOR_STRING]: 50,
      });

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.5);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.51);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it("routes using default aggregator", async () => {
      mockInstitutionWithAAndB();

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      });

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING,
      });

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it("falls back to default volume if institution specific volume doesnt have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: {
          test: {
            [TEST_EXAMPLE_B_AGGREGATOR_STRING]: 100,
          },
        },
        defaultAggregatorVolume: {
          [TEST_EXAMPLE_A_AGGREGATOR_STRING]: 100,
        },
        defaultAggregator: undefined,
      });

      mockInstitutionWithA();

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });

    it("falls back to default aggregator if institution specific and default volume dont have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: {
          test: {
            [TEST_EXAMPLE_B_AGGREGATOR_STRING]: 100,
          },
        },
        defaultAggregatorVolume: {
          [TEST_EXAMPLE_B_AGGREGATOR_STRING]: 100,
        },
        defaultAggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      });

      mockInstitutionWithA();

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });

    it("chooses a random available aggregator if institution specific, default volume, and default aggregator dont have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: undefined,
      });

      mockInstitutionWithAAndB();

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.49);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.5);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it(`returns undefined if ${TEST_EXAMPLE_A_AGGREGATOR_STRING} is the only option but ${TEST_EXAMPLE_B_AGGREGATOR_STRING} is the only supported aggregator`, async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [TEST_EXAMPLE_B_AGGREGATOR_STRING],
      });

      mockInstitutionWithA();

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(undefined);
    });

    it("returns a aggregator if that aggregator is the only supported aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [TEST_EXAMPLE_A_AGGREGATOR_STRING],
      });

      mockInstitutionWithAAndB();

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [TEST_EXAMPLE_B_AGGREGATOR_STRING],
      });

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution2.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });

    it(`returns ${TEST_EXAMPLE_A_AGGREGATOR_STRING} for job types where ${TEST_EXAMPLE_B_AGGREGATOR_STRING} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes(
        "test",
        {
          id: "testABank",
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true,
        },
        {
          id: "testBBank",
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false,
        },
      );

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
      });
      expect(institution2.aggregator).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      const institution3 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.ACCOUNT_NUMBER,
          ComboJobTypes.ACCOUNT_OWNER,
        ],
      });
      expect(institution3.aggregator).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });

    it(`returns ${TEST_EXAMPLE_B_AGGREGATOR_STRING} for job types where ${TEST_EXAMPLE_A_AGGREGATOR_STRING} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes(
        "test",
        {
          id: "testABank",
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false,
        },
        {
          id: "testBBank",
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true,
        },
      );

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
      });
      expect(institution.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
      });
      expect(institution2.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);

      const institution3 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.ACCOUNT_NUMBER,
          ComboJobTypes.ACCOUNT_OWNER,
        ],
      });
      expect(institution3.aggregator).toEqual(TEST_EXAMPLE_B_AGGREGATOR_STRING);
    });
  });
});
