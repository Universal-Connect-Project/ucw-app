import type { Request, Response } from "express";
import {
  createWidgetUrlHandler,
  validateWidgetParams,
  widgetHandler,
} from "./widgetEndpoint";
import { ComboJobTypes } from "@repo/utils";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { nonTestAggregators } from "./adapterSetup";
import { get, set } from "./services/storageClient/redis";
import fs from "node:fs";
import type { UUID } from "node:crypto";

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
    it("returns HTML when a valid token is provided", async () => {
      jest
        .spyOn(fs, "readFileSync")
        .mockReturnValueOnce("<html><body>Mock HTML content</body></html>");

      const token = "validToken123";
      const widgetParams = {
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
        targetOrigin: "https://example.com",
      };

      await set(`token-${token}`, widgetParams);

      const res = {
        send: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          token,
        },
        context: {},
      } as unknown as Request;

      await widgetHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(
        "<html><body>Mock HTML content</body></html>",
      );
    });

    it("responds with a 400 if token is missing", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await widgetHandler(
        {
          query: {},
          context: {},
        } as unknown as Request,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("A valid token is required");
    });

    it("responds with a 400 if token is invalid", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await widgetHandler(
        {
          query: {
            token: "invalidToken",
          },
          context: {},
        } as unknown as Request,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("A valid token is required");
    });
  });

  describe("createWidgetUrlHandler", () => {
    it("stores widget params in redis and returns a widget URL with token", async () => {
      const randomUUID = "111-222-333-444-555";
      jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(randomUUID);

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
        headers: {},
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

      expect(widgetUrl.pathname).toBe("/widget");

      const params = widgetUrl.searchParams;
      expect(params.get("token")).toBe(randomUUID);

      const storedData = await get(`token-${randomUUID}`);
      expect(storedData).toMatchObject({
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId: "testUserId",
        targetOrigin: "https://example.com",
        connectionId,
        aggregator: MX_AGGREGATOR_STRING,
        institutionId: "testInstitutionId",
      });
    });

    it("stores the authorization JWT and widget params in redis", async () => {
      const randomUUID = "111-111-111-111-111";
      jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(randomUUID);

      const authorizationToken = "test-jwt-token";
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

      const storedData = await get(`token-${randomUUID}`);
      expect(storedData).toMatchObject({
        authorizationJwt: authorizationToken,
        jobTypes: ComboJobTypes.TRANSACTIONS,
        userId,
        targetOrigin: "https://example.com",
      });
    });

    it("creates the widget url with only token parameter", async () => {
      const randomUUID = "test-uuid-1-2-3-4-5";
      jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(randomUUID as UUID);

      const req = {
        body: {
          jobTypes: ComboJobTypes.TRANSACTIONS,
          userId: "testUserId",
          targetOrigin: "https://example.com",
        },
        headers: {},
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
        `http://localhost:8080/widget?token=${randomUUID}`,
      );
    });
  });
});
