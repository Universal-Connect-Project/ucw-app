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

      it("responds with a 400 if aggregator is provided with an institutionId and without a connectionId", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              institutionId: "testInstitutionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              aggregator: Aggregators.TEST_A,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;aggregator&#x22; missing required peer &#x22;connectionId&#x22;",
        );
      });

      it("responds with a 400 if aggregator is provided with a connectionId and without an institutionId", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              connectionId: "testConnectionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              aggregator: Aggregators.TEST_A,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;aggregator&#x22; missing required peer &#x22;institutionId&#x22;",
        );
      });

      it("responds with a 400 if connectionId is provided with an institutionId and without a aggregator", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              connectionId: "testConnectionId",
              institutionId: "testInstitutionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;connectionId&#x22; missing required peer &#x22;aggregator&#x22;",
        );
      });

      it("responds with a 400 if connectionId is provided with an aggregator and without an institutionId", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              aggregator: Aggregators.TEST_A,
              connectionId: "testConnectionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;aggregator&#x22; missing required peer &#x22;institutionId&#x22;",
        );
      });

      it("responds with a 400 if singleAccountSelect isn't a bool", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              singleAccountSelect: "junk",
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;singleAccountSelect&#x22; must be a boolean",
        );
      });
    });
  });
});
