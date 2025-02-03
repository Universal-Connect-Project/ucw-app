import type { Request, Response } from "express";
import { instrumentationHandler } from "./instrumentationEndpoints";
import { JobTypes, MappedJobTypes } from "@repo/utils";

describe("instrumentationEndpoints", () => {
  describe("instrumentationHandler", () => {
    const correctBody = {
      current_aggregator: "testAggregator",
      current_member_guid: "currentMemberGuid",
      job_type: JobTypes.FULLHISTORY,
      single_account_select: false,
      user_id: "userId",
    };

    it("doesn't return aggregator or connection_id if current_member_guid isn't present", async () => {
      const body = { ...correctBody };
      delete body.current_member_guid;
      const req = {
        body,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        job_type: MappedJobTypes.FULLHISTORY,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        single_account_select: req.body.single_account_select,
        updated: true,
        user_id: req.body.user_id,
      });
    });

    it("doesn't return aggregator or connection_id if current_aggregator isn't present", async () => {
      const body = { ...correctBody };
      delete body.current_aggregator;
      const req = {
        body,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        job_type: MappedJobTypes.FULLHISTORY,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        single_account_select: req.body.single_account_select,
        updated: true,
        user_id: req.body.user_id,
      });
    });

    it("attaches properties to the request context and responds with success on success", async () => {
      const req = {
        body: correctBody,
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(req.context).toEqual({
        aggregator: req.body.current_aggregator,
        connection_id: req.body.current_member_guid,
        job_type: MappedJobTypes.FULLHISTORY,
        oauth_referral_source: "BROWSER",
        scheme: "vcs",
        single_account_select: req.body.single_account_select,
        updated: true,
        user_id: req.body.user_id,
      });
    });

    it("throws an error if there's no user_id", async () => {
      const req = {
        body: {
          ...correctBody,
          user_id: undefined,
        },
        context: {},
      } as unknown as Request;

      const res = {
        sendStatus: jest.fn(),
      } as unknown as Response;

      await instrumentationHandler(req, res);

      expect(res.sendStatus).toHaveBeenCalledWith(400);
    });
  });
});
