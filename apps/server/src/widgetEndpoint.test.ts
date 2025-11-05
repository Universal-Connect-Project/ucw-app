import type { Request, Response } from "express";
import {
  createWidgetUrlHandler,
  validateWidgetParams,
  widgetHandler,
} from "./widgetEndpoint";
import { ComboJobTypes } from "@repo/utils";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { nonTestAggregators } from "./adapterSetup";
import { get } from "./services/storageClient/redis";
import fs from "node:fs";

describe("server", () => {
  describe("validateWidgetParams", () => {
    it("is invalid if jobTypes is missing", () => {
      const validation = validateWidgetParams({
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual("&#x22;jobTypes&#x22; is required");
    });

    it("is invalid if jobTypes is invalid", () => {
      const validation = validateWidgetParams({
        jobTypes: "junk",
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;jobTypes&#x22; contains an invalid value",
      );
    });

    it("is invalid if userId is missing", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual("&#x22;userId&#x22; is required");
    });

    it("is invalid if aggregator is invalid", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        aggregator: "junk",
        institutionId: "testInstitutionId",
        connectionId: "testConnectionId",
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;aggregator&#x22; must be one of [akoya, akoya_sandbox, finicity, finicity_sandbox, mx, mx_int, sophtron, plaid, plaid_sandbox]",
      );
    });

    it("is invalid if aggregator is provided with an institutionId and without a connectionId", () => {
      const validation = validateWidgetParams({
        institutionId: "testInstitutionId",
        jobTypes: ComboJobTypes.TRANSACTIONS,
        aggregator: MX_AGGREGATOR_STRING,
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "aggregator missing required peer either connectionToken or connectionId",
      );
    });

    it("is invalid if aggregator is provided with a connectionId and without an institutionId", () => {
      const validation = validateWidgetParams({
        connectionId: "testConnectionId",
        jobTypes: ComboJobTypes.TRANSACTIONS,
        aggregator: MX_AGGREGATOR_STRING,
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "aggregator missing required peer institutionId",
      );
    });

    it("is invalid if connectionId is provided with an aggregator and without an institutionId", () => {
      const validation = validateWidgetParams({
        aggregator: MX_AGGREGATOR_STRING,
        connectionId: "testConnectionId",
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "aggregator missing required peer institutionId",
      );
    });

    it("is invalid if connectionId is provided without an aggregator", () => {
      const validation = validateWidgetParams({
        connectionId: "testConnectionId",
        jobTypes: ComboJobTypes.TRANSACTIONS,
        institutionId: "testInstitutionId",
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;connectionId&#x22; missing required peer &#x22;aggregator&#x22;",
      );
    });

    it("is invalid if aggregatorOverride is invalid", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        aggregatorOverride: "junk",
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        `&#x22;aggregatorOverride&#x22; must be one of [${nonTestAggregators.join(", ")}]`,
      );
    });

    it("is invalid if singleAccountSelect isn't a bool", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        singleAccountSelect: "junk",
        userId: "testUserId",
        targetOrigin: "https://example.com",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;singleAccountSelect&#x22; must be a boolean",
      );
    });

    it("is invalid if targetOrigin is missing", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual("&#x22;targetOrigin&#x22; is required");
    });

    it("is invalid if targetOrigin is empty string", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
        targetOrigin: "",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;targetOrigin&#x22; is not allowed to be empty",
      );
    });

    it("is invalid if targetOrigin is not a valid URL", () => {
      const validation = validateWidgetParams({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
        targetOrigin: "not-a-valid-url",
      });

      expect(validation.isValid).toBeFalsy();
      expect(validation.error).toEqual(
        "&#x22;targetOrigin&#x22; must be a valid uri with a scheme matching the http|https pattern",
      );
    });
  });

  describe("widgetHandler", () => {
    it("doesnt fail when params are valid", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValueOnce("<html><body>Mock HTML content</body></html>");

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          institutionId: "testInstitutionId",
          jobTypes: ComboJobTypes.TRANSACTIONS,
          userId: "testUserId",
          targetOrigin: "https://example.com",
          connectionToken: "testConnectionToken",
          aggregator: MX_AGGREGATOR_STRING,
        },
        context: {},
      } as unknown as Request;

      await widgetHandler(req, res);

      expect(res.send).toHaveBeenCalled();
    });

    it("responds with a 400 if validation fails", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await widgetHandler(
        {
          query: {
            institutionId: "testInstitutionId",
            jobTypes: ComboJobTypes.TRANSACTIONS,
            targetOrigin: "https://example.com",
            connectionToken: "testConnectionToken",
            aggregator: MX_AGGREGATOR_STRING,
          },
          context: {},
        } as unknown as Request,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("&#x22;userId&#x22; is required");
    });
  });

  describe("createWidgetUrlHandler", () => {
    it("stores connectionId in redis and returns a widget URL", async () => {
      const hiddenConnectionId = "111-222-333-444-555";
      jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(hiddenConnectionId);

      const connectionId = "testConnectionId123";
      const req = {
        body: {
          jobTypes: ComboJobTypes.TRANSACTIONS,
          userId: "testUserId",
          targetOrigin: "https://example.com",
          connectionId,
          aggregator: MX_AGGREGATOR_STRING,
          institutionId: "testInstitutionId",
        },
        get: (): string | undefined => "localhost:8080",
        protocol: "http",
      } as unknown as Request;

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await createWidgetUrlHandler(req, res);

      expect(res.json).toHaveBeenCalled();

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty("widgetUrl");

      const widgetUrl = new URL(response.widgetUrl);

      expect(["http:"]).toContain(widgetUrl.protocol);
      expect(widgetUrl.hostname).toBe("localhost");
      expect(widgetUrl.port).toBe("8080");
      expect(widgetUrl.pathname).toBe("/widget");

      const params = widgetUrl.searchParams;
      expect(params.get("jobTypes")).toBe("transactions");
      expect(params.get("userId")).toBe("testUserId");
      expect(params.get("targetOrigin")).toBe("https://example.com");
      expect(params.get("aggregator")).toBe("mx");
      expect(params.get("institutionId")).toBe("testInstitutionId");
      expect(params.get("connectionToken")).toBe(hiddenConnectionId);

      expect(params.get("connectionId")).toBeNull();

      const redisStoredConnectionId = await get(
        `connection-${hiddenConnectionId}`,
      );
      expect(redisStoredConnectionId).toBe(connectionId);
    });

    it("stores the authorization header token in redis and responds with the redis key token", async () => {
      const randomUUID = "111-111-111-111-111";
      jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(randomUUID);

      const authorizationToken = "test";
      const userId = "testUserId";

      const req = {
        headers: {
          authorization: `Bearer ${authorizationToken}`,
        },
        body: {
          jobTypes: ComboJobTypes.TRANSACTIONS,
          userId,
          targetOrigin: "https://example.com",
        },
        get: (): string | undefined => "localhost:8080",
        protocol: "http",
      } as unknown as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await createWidgetUrlHandler(req, res);

      expect(res.json).toHaveBeenCalled();

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const widgetUrl = new URL(response.widgetUrl);

      expect(widgetUrl.searchParams.get("token")).toBe(randomUUID);
      const token = await get(`${userId}-${randomUUID}`);
      expect(token).toEqual(authorizationToken);
    });

    it("creates the widget url from the requested host", async () => {
      const req = {
        body: {
          jobTypes: ComboJobTypes.TRANSACTIONS,
          userId: "testUserId",
          targetOrigin: "https://example.com",
        },
        get: (): string | undefined => "example",
        protocol: "http",
      } as unknown as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await createWidgetUrlHandler(req, res);

      expect(res.json).toHaveBeenCalled();

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const { widgetUrl } = response;

      expect(widgetUrl).toEqual(
        "http://localhost:8080/widget?jobTypes=transactions&userId=testUserId&targetOrigin=https%3A%2F%2Fexample.com",
      );
    });
  });
});
