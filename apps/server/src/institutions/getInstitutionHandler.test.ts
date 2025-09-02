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
import { mxTestData, waitFor } from "@repo/utils-dev-dependency";
import setupPerformanceHandlers from "../shared/test/setupPerformanceHandlers";

const { institutionData: mxInstitutionData } = mxTestData;

const ucpInstitutionId = "testAggregatorInstitutionGuid";

describe("getInstitutionHandler", () => {
  describe("should record performance", () => {
    describe("success", () => {
      it("sets a new performanceSessionId on context, records a start event with the correct props, and records a pause event with the correct props", async () => {
        const connectionId = crypto.randomUUID();

        jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(connectionId);

        const req = {
          context: {
            jobTypes: [ComboJobTypes.TRANSACTIONS],
          },
          params: {
            institution_guid: ucpInstitutionId,
          },
        } as unknown as Request;

        const res = {
          send: jest.fn(),
        } as unknown as Response;

        const requestLog = setupPerformanceHandlers([
          "connectionStart",
          "connectionPause",
        ]);

        await getInstitutionHandler(req, res);

        expect(requestLog[0]).toEqual(
          expect.objectContaining({
            method: "POST",
            eventType: "connectionStart",
            connectionId,
            body: {
              aggregatorId: MX_AGGREGATOR_STRING,
              institutionId: "testAggregatorInstitutionGuid",
              jobTypes: req.context.jobTypes,
              recordDuration: true,
              shouldRecordResult: false,
            },
          }),
        );

        await waitFor(() => {
          expect(requestLog.length).toBe(2);
        });

        expect(requestLog[1]).toEqual(
          expect.objectContaining({
            method: "PUT",
            eventType: "connectionPause",
            connectionId,
            body: {},
          }),
        );
      });
    });

    describe("failure", () => {
      it("sets a new performanceSessionId on context, records a start event with the correct props, records a pause event with shouldRecordResult if the request fails, and responds with a 400", () => {});
    });
  });

  describe("shouldn't record performance", () => {
    describe("success", () => {
      it("sets a new performanceSessionId on context and doesn't record a start or pause event", () => {});
    });

    describe("failure", () => {
      it("sets a new performanceSessionId on context, doesn't record start or pause events if the request fails, and responds with a 400", () => {});
    });
  });

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
      aggregator: MX_INT_AGGREGATOR_STRING,
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
      aggregator: MX_INT_AGGREGATOR_STRING,
      supports_oauth: ucpMXInstitution.supports_oauth,
      ucpInstitutionId,
      url: ucpInstitution.url,
    });
  });
});
