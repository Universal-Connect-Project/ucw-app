import type { Request, Response } from "express";
import { instrumentationHandler } from "./instrumentationEndpoints";
import { ComboJobTypes } from "@repo/utils";

describe("instrumentationEndpoints", () => {
  describe("instrumentationHandler", () => {
    const correctBody = {
      current_aggregator: "testAggregator",
      current_member_guid: "currentMemberGuid",
      jobTypes: [ComboJobTypes.TRANSACTION_HISTORY],
      single_account_select: false,
    };

    const correctParams = {
      userId: "userId",
    };

    it("doesn't return aggregator or connectionId if current_member_guid isn't present", async () => {
      const body = { ...correctBody };
      delete body.current_member_guid;
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
        single_account_select: req.body.single_account_select,
        updated: true,
        userId: req.params.userId,
      });
    });

    it("doesn't return aggregator or connectionId if current_aggregator isn't present", async () => {
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
        single_account_select: req.body.single_account_select,
        updated: true,
        userId: req.params.userId,
      });
    });

    it("attaches properties to the request context and responds with success on success", async () => {
      const req = {
        body: correctBody,
        params: correctParams,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        aggregator: req.body.current_aggregator,
        connectionId: req.body.current_member_guid,
        jobTypes: req.body.jobTypes,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        single_account_select: req.body.single_account_select,
        updated: true,
        userId: req.params.userId,
      });
    });
  });
});
