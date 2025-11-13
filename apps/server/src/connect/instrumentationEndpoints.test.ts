import type { Request, Response } from "express";
import { instrumentationHandler } from "./instrumentationEndpoints";
import { ComboJobTypes } from "@repo/utils";
import { get, set } from "../services/storageClient/redis";

describe("instrumentationEndpoints", () => {
  describe("instrumentationHandler", () => {
    const userId = "testUserId";
    const token = "validToken";

    it("retrieves widget params from Redis, sets context, and returns params with parsed jobTypes", async () => {
      const widgetParams = {
        jobTypes: `${ComboJobTypes.TRANSACTION_HISTORY},${ComboJobTypes.TRANSACTIONS}`,
        singleAccountSelect: "true",
        userId,
      };

      await set(`token-${token}`, widgetParams);

      const req = {
        params: { token },
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...widgetParams,
        jobTypes: [
          ComboJobTypes.TRANSACTION_HISTORY,
          ComboJobTypes.TRANSACTIONS,
        ],
      });
      expect(req.context).toEqual({
        jobTypes: [
          ComboJobTypes.TRANSACTION_HISTORY,
          ComboJobTypes.TRANSACTIONS,
        ],
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: true,
        userId,
      });
    });

    it("handles singleAccountSelect as false when set to 'false'", async () => {
      const widgetParams = {
        jobTypes: ComboJobTypes.TRANSACTIONS,
        singleAccountSelect: "false",
        userId,
      };

      await set(`token-${token}`, widgetParams);

      const req = {
        params: { token },
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(req.context.singleAccountSelect).toBe(false);
    });

    it("attaches aggregatorOverride to the request context if present", async () => {
      const widgetParams = {
        jobTypes: ComboJobTypes.TRANSACTIONS,
        singleAccountSelect: "true",
        aggregatorOverride: "testAggregatorOverride",
        userId,
      };

      await set(`token-${token}`, widgetParams);

      const req = {
        params: { token },
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(req.context.aggregatorOverride).toBe("testAggregatorOverride");
    });

    it("deletes the token from Redis after successful retrieval", async () => {
      const widgetParams = {
        jobTypes: ComboJobTypes.TRANSACTIONS,
        singleAccountSelect: "true",
        userId,
      };

      await set(`token-${token}`, widgetParams);

      const req = {
        params: { token },
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      const deletedToken = await get(`token-${token}`);
      expect(deletedToken).toBeUndefined();
    });

    it("returns a 400 error if the token is invalid or missing", async () => {
      const req = {
        params: { token: "invalidToken" },
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(String),
      });
    });
  });
});
