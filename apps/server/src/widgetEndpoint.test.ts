import type { Request, Response } from "express";
import { widgetHandler } from "./widgetEndpoint";
import { ComboJobTypes } from "@repo/utils";
import { Aggregators } from "./shared/contract";
import { invalidAggregatorString } from "./utils/validators";

/* eslint-disable @typescript-eslint/unbound-method  */

describe("server", () => {
  describe("widgetHandler", () => {
    describe("validation", () => {
      it("responds with a 400 if jobTypes is missing", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;jobTypes&#x22; is required",
        );
      });

      it("responds with a 400 if jobTypes is invalid", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: "junk",
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          `&#x22;jobTypes&#x22; contains an invalid value`,
        );
      });

      it("responds with a 400 if userId is missing", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("&#x22;userId&#x22; is required");
      });

      it("responds with a 400 if aggregator is invalid", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              aggregator: "junk",
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      });

      it("responds with a 400 if aggregator is provided without a connectionId", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              aggregator: Aggregators.TEST_A,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;value&#x22; contains [aggregator] without its required peers [connectionId]",
        );
      });

      it("responds with a 400 if connectionId is provided without a aggregator", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              connectionId: "testConnectionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;value&#x22; contains [connectionId] without its required peers [aggregator]",
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
              jobTypes: ComboJobTypes.TRANSACTIONS,
              single_account_select: "junk",
              userId: "testUserId",
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
