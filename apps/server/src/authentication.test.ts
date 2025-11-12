import type { Request, Response } from "express";
import useAuthentication, {
  cookieAuthenticationMiddleware,
  tokenAuthenticationMiddleware,
  tokenCookieName,
} from "./authentication";
import { get, set } from "./services/storageClient/redis";
import type { Express } from "express";

import * as config from "./config";

jest.mock("./config");

describe("authentication", () => {
  describe("tokenAuthenticationMiddleware", () => {
    it("pulls the JWT from redis with the given token, adds the bearer token to the request headers, removes JWT from redis, sets a cookie, and calls next", async () => {
      const token = "testToken";
      const jwt = "testJwt";
      const userId = "testUserId";
      const jobTypes = "transactions";

      jest.spyOn(config, "getConfig").mockReturnValue({});

      const redisKey = `token-${token}`;
      const widgetParams = {
        authorizationJwt: jwt,
        userId,
        jobTypes,
        targetOrigin: "https://example.com",
      };

      await set(redisKey, widgetParams);

      expect(await get(redisKey)).toEqual(widgetParams);

      const req = {
        headers: {},
        query: {
          token,
        },
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await tokenAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toEqual(`Bearer ${jwt}`);

      const updatedParams = await get(redisKey);
      expect(updatedParams).toEqual({
        userId,
        jobTypes,
        targetOrigin: "https://example.com",
      });
      expect(updatedParams.authorizationJwt).toBeUndefined();

      expect(res.cookie).toHaveBeenCalledWith(tokenCookieName, jwt, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it("uses the AUTHORIZATION_TOKEN_COOKIE_SAMESITE if it's available", async () => {
      const token = "testToken";
      const jwt = "testJwt";
      const userId = "testUserId";

      jest.spyOn(config, "getConfig").mockReturnValue({
        AUTHORIZATION_TOKEN_COOKIE_SAMESITE: "none",
      });

      const redisKey = `token-${token}`;
      const widgetParams = {
        authorizationJwt: jwt,
        userId,
        jobTypes: "transactions",
        targetOrigin: "https://example.com",
      };

      await set(redisKey, widgetParams);

      expect(await get(redisKey)).toEqual(widgetParams);

      const req = {
        headers: {},
        query: {
          token,
        },
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await tokenAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toEqual(`Bearer ${jwt}`);

      const updatedParams = await get(redisKey);
      expect(updatedParams.authorizationJwt).toBeUndefined();

      expect(res.cookie).toHaveBeenCalledWith(tokenCookieName, jwt, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it("responds with a 401 if there is no JWT in the widget params", async () => {
      const token = "testToken";

      jest.spyOn(config, "getConfig").mockReturnValue({});

      const redisKey = `token-${token}`;
      const widgetParams = {
        userId: "testUserId",
        jobTypes: "transactions",
        targetOrigin: "https://example.com",
        // No authorizationJwt
      };

      await set(redisKey, widgetParams);

      const req = {
        headers: {},
        query: {
          token,
        },
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await tokenAuthenticationMiddleware(req, res, next);

      expect(res.status).toHaveBeenLastCalledWith(401);
      expect(res.send).toHaveBeenLastCalledWith("token invalid or expired");
      expect(next).not.toHaveBeenCalled();
    });

    it("just calls next if there's no token", async () => {
      const req = {
        headers: {},
        query: {},
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await tokenAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toBeUndefined();
      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("cookieAuthenticationMiddleware", () => {
    it("puts the authorization token from the cookie into the headers", () => {
      const cookieToken = "testCookieToken";

      const req = {
        cookies: {
          [tokenCookieName]: cookieToken,
        },
        headers: {},
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      cookieAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toEqual(`Bearer ${cookieToken}`);
      expect(next).toHaveBeenCalled();
    });

    it("doesn't change the authorization if there already is one provided and there's also a cookie", () => {
      const cookieToken = "testCookieToken";

      const req = {
        cookies: {
          [tokenCookieName]: cookieToken,
        },
        headers: {
          authorization: "test",
        },
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      cookieAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toEqual("test");
      expect(next).toHaveBeenCalled();
    });

    it("doesn't change the authorization if there's no cookie", () => {
      const req = {
        cookies: {},
        headers: {
          authorization: "test",
        },
      } as unknown as Request;
      const res = {} as Response;
      const next = jest.fn();

      cookieAuthenticationMiddleware(req, res, next);

      expect(req.headers.authorization).toEqual("test");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("useAuthentication", () => {
    it("calls app.use with all the middleware if it has all the config variables necessary", () => {
      const app = {
        get: jest.fn(),
        use: jest.fn(),
      } as unknown as Express;

      jest.spyOn(config, "getConfig").mockReturnValue({
        AUTHENTICATION_ENABLE: "true",
        AUTHENTICATION_AUDIENCE: "test",
        AUTHENTICATION_ISSUER_BASE_URL: "test",
        AUTHENTICATION_TOKEN_SIGNING_ALG: "RS256",
        AUTHENTICATION_SCOPES: "test",
      });

      useAuthentication(app);

      expect(app.use).toHaveBeenCalledTimes(4);
      expect(app.get).toHaveBeenCalledTimes(0);
    });

    it("calls app.use with 2 of the middleware if there are missing variables", () => {
      const app = {
        get: jest.fn(),
        use: jest.fn(),
      } as unknown as Express;

      jest.spyOn(config, "getConfig").mockReturnValue({
        AUTHENTICATION_ENABLE: "true",
      });

      useAuthentication(app);

      expect(app.use).toHaveBeenCalledTimes(2);
      expect(app.get).toHaveBeenCalledTimes(0);
    });

    it("doesn't add any middleware or endpoints if authentication is not enabled", () => {
      const app = {
        get: jest.fn(),
        use: jest.fn(),
      } as unknown as Express;

      jest.spyOn(config, "getConfig").mockReturnValue({});

      useAuthentication(app);

      expect(app.use).toHaveBeenCalledTimes(0);
      expect(app.get).toHaveBeenCalledTimes(0);
    });
  });
});
