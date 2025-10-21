import type { Request, Response } from "express";
import { widgetHandler } from "./widgetEndpoint";
import { ComboJobTypes } from "@repo/utils";
import { invalidAggregatorString } from "./utils/validators";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { nonTestAggregators } from "./adapterSetup";

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
              targetOrigin: "https://example.com",
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
              targetOrigin: "https://example.com",
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
              targetOrigin: "https://example.com",
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
              targetOrigin: "https://example.com",
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
              aggregator: MX_AGGREGATOR_STRING,
              userId: "testUserId",
              targetOrigin: "https://example.com",
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
              aggregator: MX_AGGREGATOR_STRING,
              userId: "testUserId",
              targetOrigin: "https://example.com",
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
              targetOrigin: "https://example.com",
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
              aggregator: MX_AGGREGATOR_STRING,
              connectionId: "testConnectionId",
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
              targetOrigin: "https://example.com",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;aggregator&#x22; missing required peer &#x22;institutionId&#x22;",
        );
      });

      it("responds with a 400 if aggregatorOverride is invalid", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              aggregatorOverride: "junk",
              userId: "testUserId",
              targetOrigin: "https://example.com",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          `&#x22;aggregatorOverride&#x22; must be one of [${nonTestAggregators.join(", ")}]`,
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
              targetOrigin: "https://example.com",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;singleAccountSelect&#x22; must be a boolean",
        );
      });

      it("responds with a 400 if targetOrigin is missing", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;targetOrigin&#x22; is required",
        );
      });

      it("responds with a 400 if targetOrigin is empty string", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
              targetOrigin: "",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;targetOrigin&#x22; is not allowed to be empty",
        );
      });

      it("responds with a 400 if targetOrigin is not a valid URL", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
              targetOrigin: "not-a-valid-url",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          "&#x22;targetOrigin&#x22; must be a valid uri with a scheme matching the http|https pattern",
        );
      });

      it("accepts valid targetOrigin values", () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        widgetHandler(
          {
            query: {
              jobTypes: ComboJobTypes.TRANSACTIONS,
              userId: "testUserId",
              targetOrigin: "http://localhost:3000",
            },
          } as unknown as Request,
          res,
        );

        expect(res.status).not.toHaveBeenCalledWith(400);
      });
    });
  });
});
