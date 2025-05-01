import type { Request, Response } from "express";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING,
  TEST_EXAMPLE_C_AGGREGATOR_STRING,
} from "../test-adapter";
import {
  getInstitutionHandler,
  OAuthOnlyAggregatorsList,
} from "./getInstitutionHandler";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import { ComboJobTypes } from "@repo/utils";
import { elasticSearchInstitutionData } from "../test/testData/institution";

const ucpInstitutionId = "testAggregatorInstitutionGuid";

describe("getInstitutionHandler", () => {
  it("returns an institution object with name, url, and logo_url properties from the ucp institution list", async () => {
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
        institution_guid: ucpInstitutionId,
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
      supports_oauth: ucpTestExampleInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });

  it("returns the institution by the aggregator id if it has a aggregator", async () => {
    const context = {
      aggregator: TEST_EXAMPLE_C_AGGREGATOR_STRING,
    };

    const req = {
      context,
      params: {
        institution_guid: ucpInstitutionId,
      },
    } as unknown as Request;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getInstitutionHandler(req, res);

    const ucpInstitution = elasticSearchInstitutionData;
    const ucpTestExampleInstitution =
      ucpInstitution[TEST_EXAMPLE_A_AGGREGATOR_STRING];

    expect(res.send).toHaveBeenCalledWith({
      code: ucpTestExampleInstitution.id,
      credentials: [],
      guid: ucpTestExampleInstitution.id,
      instructional_data: {},
      logo_url: ucpInstitution.logo,
      name: ucpInstitution.name,
      aggregator: TEST_EXAMPLE_C_AGGREGATOR_STRING,
      supports_oauth: ucpTestExampleInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });

  it("overrides 'supports_oauth' when aggregator flow requires OAuth", async () => {
    jest.spyOn(preferences, "getPreferences").mockResolvedValue({
      ...testPreferences,
      supportedAggregators: OAuthOnlyAggregatorsList,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const akoyaAggregator = "akoya";
    const context = {
      aggregator: akoyaAggregator,
    };

    const req = {
      context,
      params: {
        institution_guid: ucpInstitutionId,
      },
    } as unknown as Request;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getInstitutionHandler(req, res);

    const ucpInstitution = elasticSearchInstitutionData;
    const ucpTestExampleInstitution = ucpInstitution[akoyaAggregator];

    expect(ucpTestExampleInstitution.supports_oauth).toBeFalsy();

    expect(res.send).toHaveBeenCalledWith({
      code: ucpTestExampleInstitution.id,
      credentials: [],
      guid: ucpTestExampleInstitution.id,
      instructional_data: {},
      logo_url: ucpInstitution.logo,
      name: ucpInstitution.name,
      aggregator: akoyaAggregator,
      supports_oauth: true, // supports_oauth gets overriden because it's akoya
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });
});
