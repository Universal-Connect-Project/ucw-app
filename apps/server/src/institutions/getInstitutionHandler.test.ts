import type { Request, Response } from "express";
import { getInstitutionHandler } from "./getInstitutionHandler";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";
import { ComboJobTypes } from "@repo/utils";
import { elasticSearchInstitutionData } from "../test/testData/institution";
import {
  MX_AGGREGATOR_STRING,
  MX_INT_AGGREGATOR_STRING,
} from "@repo/mx-adapter";
import { mxTestData } from "@repo/utils-dev-dependency";

const { institutionData: mxInstitutionData } = mxTestData;

const ucpInstitutionId = "testAggregatorInstitutionGuid";

describe("getInstitutionHandler", () => {
  it("returns an institution object with name, url, and logo_url properties from the ucp institution list", async () => {
    jest.spyOn(preferences, "getPreferences").mockResolvedValue({
      ...testPreferences,
      supportedAggregators: [MX_AGGREGATOR_STRING],
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
    const ucpMxInstitution = ucpInstitution[MX_AGGREGATOR_STRING];

    expect(res.send).toHaveBeenCalledWith({
      code: mxInstitutionData.institution.code,
      credentials: [],
      guid: mxInstitutionData.institution.code,
      instructional_data: {},
      logo_url: ucpInstitution.logo,
      name: ucpInstitution.name,
      aggregator: MX_INT_AGGREGATOR_STRING,
      supports_oauth: ucpMxInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });

  it("returns the institution by the aggregator id if it has a aggregator", async () => {
    const context = {
      aggregator: MX_AGGREGATOR_STRING,
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
    const ucpMXInstitution = ucpInstitution[MX_AGGREGATOR_STRING];

    expect(res.send).toHaveBeenCalledWith({
      code: mxInstitutionData.institution.code,
      credentials: [],
      guid: mxInstitutionData.institution.code,
      instructional_data: {},
      logo_url: ucpInstitution.logo,
      name: ucpInstitution.name,
      aggregator: MX_AGGREGATOR_STRING,
      supports_oauth: ucpMXInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });

  it("returns the institution by the aggregator id if it has an aggregatorOverride", async () => {
    const context = {
      aggregatorOverride: MX_AGGREGATOR_STRING,
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
    const ucpMXInstitution = ucpInstitution[MX_AGGREGATOR_STRING];

    expect(res.send).toHaveBeenCalledWith({
      code: mxInstitutionData.institution.code,
      credentials: [],
      guid: mxInstitutionData.institution.code,
      instructional_data: {},
      logo_url: ucpInstitution.logo,
      name: ucpInstitution.name,
      aggregator: MX_AGGREGATOR_STRING,
      supports_oauth: ucpMXInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });
});
