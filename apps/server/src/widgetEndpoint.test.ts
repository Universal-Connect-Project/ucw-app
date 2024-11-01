import type { Request, Response } from "express";
import he from "he";
import { widgetHandler } from "./widgetEndpoint";
import { JobTypes } from "@repo/utils";
import { Aggregators } from "./shared/contract";
import { invalidAggregatorString } from "./utils/validators";

/* eslint-disable @typescript-eslint/unbound-method  */

describe("server", () => {
  describe("widgetHandler", () => {
    describe("validation", () => {
      it("responds with a 400 if job_type is missing", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;job_type&#x22; is required",
        );
      });

      it("responds with a 400 if job_type is invalid", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              job_type: "junk",
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          `&#x22;job_type&#x22; must be one of [${Object.values(JobTypes).join(", ")}]`,
        );
      });

      it("responds with a 400 if user_id is missing", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;user_id&#x22; is required",
        );
      });

      it("responds with a 400 if aggregator is invalid", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              aggregator: "junk",
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          he.encode(invalidAggregatorString),
        );
      });

      it("responds with a 400 if aggregator is provided without a connection_id", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              aggregator: Aggregators.TEST_A,
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;value&#x22; contains [aggregator] without its required peers [connection_id]",
        );
      });

      it("responds with a 400 if connection_id is provided without a aggregator", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              connection_id: "testConnectionId",
              job_type: JobTypes.AGGREGATE,
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;value&#x22; contains [connection_id] without its required peers [aggregator]",
        );
      });

      it("responds with a 400 if single_account_select isn't a bool", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              single_account_select: "junk",
              user_id: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;single_account_select&#x22; must be a boolean",
        );
      });
    });
  });
});
