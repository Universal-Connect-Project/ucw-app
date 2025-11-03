import type { Request, Response } from "express";
import { instrumentationHandler } from "./instrumentationEndpoints";
import { ComboJobTypes } from "@repo/utils";

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
        context: {
          connectionId: "existingConnectionId",
        },
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        connectionId: "existingConnectionId",
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
        context: {
          connectionId: "MBR-12345", // connectionId must exist for aggregator to be set
        },
      } as unknown as Request;
      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        aggregatorOverride: "testAggregatorOverride",
        aggregator: "testAggregator",
        connectionId: "MBR-12345",
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });

    it("attaches properties to the request context and responds with success on success", async () => {
      const req = {
        body: correctBody,
        params: correctParams,
        context: {
          connectionId: "existingConnectionId",
        },
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        aggregator: req.body.current_aggregator,
        connectionId: "existingConnectionId",
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        singleAccountSelect: req.body.singleAccountSelect,
        userId: req.params.userId,
      });
    });
  });
});
