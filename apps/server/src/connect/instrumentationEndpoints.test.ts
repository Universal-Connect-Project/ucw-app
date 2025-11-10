import type { Request, Response } from "express";
import { instrumentationHandler } from "./instrumentationEndpoints";
import { ComboJobTypes } from "@repo/utils";
import { get, set } from "../services/storageClient/redis";

describe("instrumentationEndpoints", () => {
  describe("instrumentationHandler", () => {
    const correctBody = {
      current_aggregator: "testAggregator",
      jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
      singleAccountSelect: false,
    };

    const correctParams = {
      userId: "userId",
    };

    it("doesn't set aggregator if connectionId isn't present in context", async () => {
      const body = { ...correctBody };
      const req = {
        body,
        params: correctParams,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });

    it("doesn't set aggregator if current_aggregator isn't present", async () => {
      const body = { ...correctBody };
      delete body.current_aggregator;
      const req = {
        body,
        params: correctParams,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });

    it("attaches aggregatorOverride to the request context if present", async () => {
      const body = {
        ...correctBody,
        aggregatorOverride: "testAggregatorOverride",
      };
      const req = {
        body,
        params: correctParams,
        context: {},
      } as unknown as Request;
      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        aggregatorOverride: "testAggregatorOverride",
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });

    it("attaches properties to the request context and responds with connectionId and deletes redis token on success", async () => {
      const connectionToken = "validToken";
      const connectionId = "existingConnectionId";
      set(`connection-${connectionToken}`, connectionId);

      const req = {
        body: { ...correctBody, connectionToken },
        params: correctParams,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      const deletedConnectionId = await get(`connection-${connectionToken}`);
      expect(deletedConnectionId).toBeUndefined();

      expect(res.json).toHaveBeenCalledWith({ connectionId });
      expect(req.context).toEqual({
        aggregator: req.body.current_aggregator,
        connectionId,
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });

    it("throws an error if the connectionToken is invalid", async () => {
      const req = {
        body: { ...correctBody, connectionToken: "invalidToken" },
        params: correctParams,
        context: {},
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or expired connectionToken",
      });
    });
  });
});
