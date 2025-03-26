import type { Request, Response } from "express";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  testExampleInstitution,
} from "../test-adapter";
import { getInstitutionHandler } from "./getInstitutionHandler";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import { ComboJobTypes } from "@repo/utils";
import { elasticSearchInstitutionData } from "../test/testData/institution";

describe("getInstitutionHandler", () => {
  it("returns the institution by the aggregator id if it has a aggregator", async () => {
    const context = {
      aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
    };

    const req = {
      context,
      params: {
        institution_guid: "testAggregatorInstitutionGuid",
      },
    } as unknown as Request;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getInstitutionHandler(req, res);

    expect(res.send).toHaveBeenCalledWith({
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
    });
  });

  it("returns the institution by the ucp id if it doesn't have a aggregator", async () => {
    jest.spyOn(preferences, "getPreferences").mockResolvedValue({
      ...testPreferences,
      supportedAggregators: [TEST_EXAMPLE_B_AGGREGATOR_STRING],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    };
    const req = {
      context,
      params: {
        institution_guid: "testAggregatorInstitutionGuid",
      },
    } as unknown as Request;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getInstitutionHandler(req, res);

    const ucpInstitution = elasticSearchInstitutionData;
    const ucpTestExampleInstitution =
      ucpInstitution[TEST_EXAMPLE_B_AGGREGATOR_STRING];

    expect(res.send).toHaveBeenCalledWith({
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
    });
  });
});
