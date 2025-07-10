import { ComboJobTypes } from "@repo/utils";
import {
  type GetInstitutionsRequest,
  getSearchInstitutionsHandler,
} from "./getSearchInstitutionsHandler";
import { transformedInstitutionList } from "../test/testData/institution";
import type { Response } from "express";

describe("getSearchInstitutionsHandler", () => {
  it("returns a list of institutions", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    };

    const req = {
      context,
      query: {
        page: "1",
        pageSize: "25",
        search: "MX",
      },
    } as unknown as GetInstitutionsRequest;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getSearchInstitutionsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(transformedInstitutionList);
  });

  it("returns institutions when searching by routing number", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    };

    const req = {
      context,
      query: {
        page: "1",
        pageSize: "25",
        routingNumber: "1234567",
      },
    } as unknown as GetInstitutionsRequest;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getSearchInstitutionsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(transformedInstitutionList);
  });

  it("returns institutions with aggregatorOverride", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
      aggregatorOverride: "mx",
    };

    const req = {
      context,
      query: {
        page: "1",
        pageSize: "25",
        search: "MX",
      },
    } as unknown as GetInstitutionsRequest;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getSearchInstitutionsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(transformedInstitutionList);
  });
});
