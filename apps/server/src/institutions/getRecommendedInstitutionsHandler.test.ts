import { ComboJobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import { getRecommendedInstitutionsHandler } from "./getRecommendedInstitutionsHandler";
import { transformedPopularInstitutionsList } from "../test/testData/institution";

describe("getRecommendedInstitutionsHandler", () => {
  it("returns a list of favorite institutions", async () => {
    const context = {
      jobTypes: [ComboJobTypes.TRANSACTIONS],
    };

    const req = {
      context,
    } as unknown as Request;

    const res = {
      send: jest.fn(),
    } as unknown as Response;

    await getRecommendedInstitutionsHandler(req, res);

    expect(res.send).toHaveBeenCalledWith(transformedPopularInstitutionsList);
  });
});
