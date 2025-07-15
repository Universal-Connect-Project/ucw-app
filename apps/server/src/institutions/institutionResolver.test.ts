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
import { SOPHTRON_ADAPTER_NAME } from "@repo/sophtron-adapter/src/constants";
import {
  MX_AGGREGATOR_STRING,
  MX_INT_AGGREGATOR_STRING,
} from "@repo/mx-adapter";

const mockInstitutionWithMxAndSophtron = (institutionId = "test") => {
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
          [MX_AGGREGATOR_STRING]: {
            id: "mx_id",
            supports_aggregation: true,
          },
          [SOPHTRON_ADAPTER_NAME]: {
            id: "sophtron_bank",
            supports_aggregation: true,
          },
        },
      };
    },
  );
};

const mockInstitutionWithSophtron = (
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
          [SOPHTRON_ADAPTER_NAME]: {
            id: "a_id",
            supports_aggregation: true,
          },
          [MX_AGGREGATOR_STRING]: {
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
  aggregatorIntegrationMap: Record<string, InstitutionAggregator>,
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
          ...aggregatorIntegrationMap,
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

    it("resolves to the aggregatorOverride with a regular adapter and a non test institution", async () => {
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
              is_test_bank: false,
              [MX_AGGREGATOR_STRING]: {
                id: aggregatorInstitutionId,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        aggregatorOverride: MX_AGGREGATOR_STRING,
        ucpInstitutionId: aggregatorInstitutionId,
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });

      expect(institution).toEqual({
        aggregator: MX_AGGREGATOR_STRING,
        id: aggregatorInstitutionId,
        logo_url: institutionData.logo,
        name: institutionData.name,
        url: institutionData.url,
      });
    });

    it("resolves to the aggregatorOverride's test adapter with a regular adapter and a test institution", async () => {
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
              is_test_bank: true,
              [MX_AGGREGATOR_STRING]: {
                id: aggregatorInstitutionId,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        aggregatorOverride: MX_AGGREGATOR_STRING,
        ucpInstitutionId: aggregatorInstitutionId,
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });

      expect(institution).toEqual({
        aggregator: MX_INT_AGGREGATOR_STRING,
        id: aggregatorInstitutionId,
        logo_url: elasticSearchInstitutionData.logo,
        name: elasticSearchInstitutionData.name,
        url: elasticSearchInstitutionData.url,
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
              is_test_bank: true,
              [MX_AGGREGATOR_STRING]: {
                id: aggregatorInstitutionId,
              },
            },
          };
        },
      );

      const institution = await resolveInstitutionAggregator({
        aggregatorOverride: MX_INT_AGGREGATOR_STRING,
        ucpInstitutionId: aggregatorInstitutionId,
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });

      expect(institution).toEqual({
        aggregator: MX_INT_AGGREGATOR_STRING,
        id: aggregatorInstitutionId,
        logo_url: elasticSearchInstitutionData.logo,
        name: elasticSearchInstitutionData.name,
        url: elasticSearchInstitutionData.url,
      });
    });

    it(`resolves to ${MX_INT_AGGREGATOR_STRING} if its a test bank and ${MX_AGGREGATOR_STRING} is the aggregator`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: `/institutions/_doc/test`,
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              is_test_bank: true,
              [MX_AGGREGATOR_STRING]: {
                id: "a_id",
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
      expect(institution.aggregator).toEqual(MX_INT_AGGREGATOR_STRING);
    });

    it(`resolves to ${MX_AGGREGATOR_STRING} if it's the only option`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              is_test_bank: false,
              [SOPHTRON_ADAPTER_NAME]: {
                id: null,
              },
              [MX_AGGREGATOR_STRING]: {
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
      expect(institution.aggregator).toEqual(MX_AGGREGATOR_STRING);
    });

    it(`resolves to ${SOPHTRON_ADAPTER_NAME} if its the only option`, async () => {
      mockInstitutionWithSophtron("test");

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it(`resolves to ${MX_AGGREGATOR_STRING} if it supports history and ${SOPHTRON_ADAPTER_NAME} doesnt`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              is_test_bank: false,
              [SOPHTRON_ADAPTER_NAME]: {
                id: "aBank",
                [JobTypeSupports.AGGREGATE]: true,
              },
              [MX_AGGREGATOR_STRING]: {
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
      expect(institution.aggregator).toEqual(MX_AGGREGATOR_STRING);
    });

    it(`resolves to ${MX_AGGREGATOR_STRING} if it doesnt support history, but it does support aggregation, and nothing else supports fullhistory`, async () => {
      ElasticSearchMock.add(
        {
          method: "GET",
          path: "/institutions/_doc/test",
        },
        () => {
          return {
            _source: {
              ...elasticSearchInstitutionData,
              is_test_bank: false,
              [SOPHTRON_ADAPTER_NAME]: {
                id: null,
              },
              [MX_AGGREGATOR_STRING]: {
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
      expect(institution.aggregator).toEqual(MX_AGGREGATOR_STRING);
    });

    it("routes using institution specific volume", async () => {
      const institutionId = "institutionId";

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: {
          [institutionId]: {
            [MX_AGGREGATOR_STRING]: 70,
            [SOPHTRON_ADAPTER_NAME]: 30,
          },
        },
        defaultAggregatorVolume: undefined,
        defaultAggregator: undefined,
      });

      mockInstitutionWithMxAndSophtron(institutionId);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.7);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: institutionId,
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(MX_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.71);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: institutionId,
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it("routes using default volume", async () => {
      mockInstitutionWithMxAndSophtron();

      expect(testPreferences.defaultAggregatorVolume).toEqual({
        [MX_AGGREGATOR_STRING]: 50,
        [SOPHTRON_ADAPTER_NAME]: 50,
      });

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.5);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(MX_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.51);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it("routes using default aggregator", async () => {
      mockInstitutionWithMxAndSophtron();

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: SOPHTRON_ADAPTER_NAME,
      });

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: MX_AGGREGATOR_STRING,
      });

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(MX_AGGREGATOR_STRING);
    });

    it("falls back to default volume if institution specific volume doesnt have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: {
          test: {
            [MX_AGGREGATOR_STRING]: 100,
          },
        },
        defaultAggregatorVolume: {
          [SOPHTRON_ADAPTER_NAME]: 100,
        },
        defaultAggregator: undefined,
      });

      mockInstitutionWithSophtron();

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it("falls back to default aggregator if institution specific and default volume dont have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: {
          test: {
            [MX_AGGREGATOR_STRING]: 100,
          },
        },
        defaultAggregatorVolume: {
          [MX_AGGREGATOR_STRING]: 100,
        },
        defaultAggregator: SOPHTRON_ADAPTER_NAME,
      });

      mockInstitutionWithSophtron();

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it("chooses a random available aggregator if institution specific, default volume, and default aggregator dont have an available aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        institutionAggregatorVolumeMap: undefined,
        defaultAggregatorVolume: undefined,
        defaultAggregator: undefined,
      });

      mockInstitutionWithMxAndSophtron();

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.49);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(MX_AGGREGATOR_STRING);

      jest.spyOn(global.Math, "random").mockReturnValueOnce(0.5);

      expect(
        (
          await resolveInstitutionAggregator({
            ucpInstitutionId: "test",
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          })
        ).aggregator,
      ).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it(`returns undefined if ${SOPHTRON_ADAPTER_NAME} is the only option but ${MX_AGGREGATOR_STRING} is the only supported aggregator`, async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [MX_AGGREGATOR_STRING],
      });

      mockInstitutionWithSophtron();

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(undefined);
    });

    it("returns an aggregator if that aggregator is the only supported aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [MX_AGGREGATOR_STRING],
      });

      mockInstitutionWithMxAndSophtron();

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution.aggregator).toEqual(MX_AGGREGATOR_STRING);

      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...(testPreferences as preferences.Preferences),
        supportedAggregators: [SOPHTRON_ADAPTER_NAME],
      });

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.TRANSACTIONS],
      });
      expect(institution2.aggregator).toEqual(SOPHTRON_ADAPTER_NAME);
    });

    it(`returns ${MX_AGGREGATOR_STRING} for job types where ${SOPHTRON_ADAPTER_NAME} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes("test", {
        [MX_AGGREGATOR_STRING]: {
          id: "testABank",
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true,
        },
        [SOPHTRON_ADAPTER_NAME]: {
          id: "testBBank",
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false,
        },
      });

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
      });
      expect(institution.aggregator).toEqual(MX_AGGREGATOR_STRING);

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
      });
      expect(institution2.aggregator).toEqual(MX_AGGREGATOR_STRING);

      const institution3 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.ACCOUNT_NUMBER,
          ComboJobTypes.ACCOUNT_OWNER,
        ],
      });
      expect(institution3.aggregator).toEqual(MX_AGGREGATOR_STRING);
    });

    it(`returns ${SOPHTRON_ADAPTER_NAME} for job types where ${MX_AGGREGATOR_STRING} doesnt support the job type`, async () => {
      mockInstitutionForJobTypes("test", {
        [MX_AGGREGATOR_STRING]: {
          id: MX_AGGREGATOR_STRING,
          supports_aggregation: true,
          supports_oauth: false,
          supports_identification: false,
          supports_verification: false,
          supports_history: false,
        },
        [SOPHTRON_ADAPTER_NAME]: {
          id: SOPHTRON_ADAPTER_NAME,
          supports_aggregation: true,
          supports_oauth: true,
          supports_identification: true,
          supports_verification: true,
          supports_history: true,
        },
      });

      const institution = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_OWNER],
      });
      expect(institution.aggregator).toEqual(SOPHTRON_ADAPTER_NAME);

      const institution2 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [ComboJobTypes.ACCOUNT_NUMBER],
      });
      expect(institution2.aggregator).toEqual(SOPHTRON_ADAPTER_NAME);

      const institution3 = await resolveInstitutionAggregator({
        ucpInstitutionId: "test",
        jobTypes: [
          ComboJobTypes.TRANSACTIONS,
          ComboJobTypes.ACCOUNT_NUMBER,
          ComboJobTypes.ACCOUNT_OWNER,
        ],
      });
      expect(institution3.aggregator).toEqual(SOPHTRON_ADAPTER_NAME);
    });
  });
});
