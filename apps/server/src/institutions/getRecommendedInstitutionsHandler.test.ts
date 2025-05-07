import { ComboJobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import { getRecommendedInstitutionsHandler } from "./getRecommendedInstitutionsHandler";
import { transformedPopularInstitutionsList } from "../test/testData/institution";
import * as preferences from "../shared/preferences";
import testPreferences from "../../cachedDefaults/testData/testPreferences.json";

describe("getRecommendedInstitutionsHandler", () => {
  it("returns a list of favorite institutions", async () => {
    jest
      .spyOn(preferences, "getPreferences")
      .mockResolvedValue(testPreferences);

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
