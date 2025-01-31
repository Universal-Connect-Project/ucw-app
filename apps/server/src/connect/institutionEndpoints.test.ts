import type { Response } from "express";
import { MappedJobTypes } from "../shared/contract";
import {
  elasticSearchInstitutionData,
  transformedInstitutionList,
  transformedPopularInstitutionsList,
} from "../test/testData/institution";
import { ConnectApi } from "./connectApi";
import type {
  GetInstitutionCredentialsRequest,
  GetInstitutionsRequest,
  InstitutionRequest,
} from "./institutionEndpoints";
import {
  recommendedInstitutionsHandler,
  getInstitutionCredentialsHandler,
  getInstitutionHandler,
  getInstitutionsHandler,
} from "./institutionEndpoints";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import {
  TEST_EXAMPLE_A_LABEL_TEXT,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  testExampleCredentials,
  testExampleInstitution,
} from "../test-adapter/constants";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";

describe("institutionEndpoints", () => {
  describe("getInstitutionHandler", () => {
    it("returns the institution by the aggregator id if it has a aggregator", async () => {
      const context = {
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      };

      const req = {
        connectApi: new ConnectApi({ context }),
        context,
        params: {
          institution_guid: "testAggregatorInstitutionGuid",
        },
      } as unknown as InstitutionRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await getInstitutionHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        institution: {
          code: "testAggregatorInstitutionGuid",
          credentials: [],
          guid: "testAggregatorInstitutionGuid",
          instructional_data: {},
          logo_url: testExampleInstitution.logo_url,
          name: testExampleInstitution.name,
          aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
          aggregators: undefined,
          supports_oauth: testExampleInstitution.oauth,
          url: testExampleInstitution.url,
        },
      });
    });

    it("returns the institution by the ucp id if it doesn't have a aggregator", async () => {
      jest.spyOn(preferences, "getPreferences").mockResolvedValue({
        ...testPreferences,
        supportedAggregators: [TEST_EXAMPLE_B_AGGREGATOR_STRING],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const context = {
        job_type: "aggregate",
      };
      const req = {
        connectApi: new ConnectApi({ context }),
        context,
        params: {
          institution_guid: "testAggregatorInstitutionGuid",
        },
      } as unknown as InstitutionRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await getInstitutionHandler(req, res);

      const ucpInstitution = elasticSearchInstitutionData;
      const ucpTestExampleInstitution =
        ucpInstitution[TEST_EXAMPLE_B_AGGREGATOR_STRING];

      expect(res.send).toHaveBeenCalledWith({
        institution: {
          code: ucpTestExampleInstitution.id,
          credentials: [],
          guid: ucpTestExampleInstitution.id,
          instructional_data: {},
          logo_url: ucpInstitution.logo,
          name: ucpInstitution.name,
          aggregator: TEST_EXAMPLE_B_AGGREGATOR_STRING,
          aggregators: undefined,
          supports_oauth: testExampleInstitution.oauth,
          url: ucpInstitution.url,
        },
      });
    });
  });

  describe("getInstitutionsHandler", () => {
    it("returns a list of institutions", async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE,
      };

      const req = {
        connectApi: new ConnectApi({ context }),
        context,
        query: {
          search: "MX",
        },
      } as unknown as GetInstitutionsRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await getInstitutionsHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(transformedInstitutionList);
    });

    it("returns institutions when searching by routing number", async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE,
      };

      const req = {
        connectApi: new ConnectApi({ context }),
        context,
        query: {
          routingNumber: "1234567",
        },
      } as unknown as GetInstitutionsRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await getInstitutionsHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(transformedInstitutionList);
    });
  });

  describe("recommendedInstitutionsHandler", () => {
    it("returns a list of favorite institutions", async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE,
      };

      const req = {
        connectApi: new ConnectApi({ context }),
        context,
      } as unknown as InstitutionRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await recommendedInstitutionsHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(transformedPopularInstitutionsList);
    });
  });

  describe("getInstitutionCredentialsHandler", () => {
    it("returns with the institution credentials", async () => {
      const context = {
        job_type: MappedJobTypes.AGGREGATE,
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      };

      const connectApi = new ConnectApi({ context });

      await connectApi.init();

      const req = {
        connectApi,
        context,
        params: {
          institution_guid: "test",
        },
      } as unknown as GetInstitutionCredentialsRequest;

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      await getInstitutionCredentialsHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        credentials: [
          {
            field_name: testExampleCredentials.field_name,
            field_type: 3,
            guid: testExampleCredentials.id,
            id: testExampleCredentials.id,
            label: TEST_EXAMPLE_A_LABEL_TEXT,
          },
        ],
      });
    });
  });
});
