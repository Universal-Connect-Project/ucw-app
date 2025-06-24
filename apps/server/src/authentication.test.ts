import type { Request, Response } from "express";
import { set as mockSet } from "./__mocks__/redis";
import useAuthentication, {
  cookieAuthenticationMiddleware,
  getTokenHandler,
  tokenAuthenticationMiddleware,
  tokenCookieName,
} from "./authentication";
import { get, set } from "./services/storageClient/redis";
import type { Express } from "express";

import * as config from "./config";

jest.mock("./config");

describe("authentication", () => {
  describe("getTokenHandler", () => {
    it("stores the authorization header token in redis and responds with the redis key token", async () => {
      const authorizationToken = "test";
      const userId = "testUserId";

      const req = {
        headers: {
          authorization: `Bearer ${authorizationToken}`,
        },
        query: { userId },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      await getTokenHandler(req, res);

      const token = mockSet.mock.calls[0][0];

      expect(res.json).toHaveBeenCalledWith({
        token: token.replace(`${userId}-`, ""),
      });
      expect(token).toBeDefined();
    });

    it("fails if there's no userId", async () => {
      const authorizationToken = "test";

      const req = {
        headers: {
          authorization: `Bearer ${authorizationToken}`,
        },
        query: {},
      } as unknown as Request;
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await getTokenHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("&#x22;userId&#x22; is required");
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("tokenAuthenticationMiddleware", () => {
    it("pulls the JWT from redis with the given token and userId, adds the bearer token to the request headers, deletes the token from redis, sets a cookie, and calls next", async () => {
      const token = "testToken";
      const jwt = "testJwt";
      const userId = "testUserId";

      jest.spyOn(config, "getConfig").mockReturnValue({
        AUTHORIZATION_TOKEN_COOKIE_SAMESITE: "strict",
      });

      const redisKey = `${userId}-${token}`;

      await set(redisKey, jwt);

      expect(await get(redisKey)).toEqual(jwt);

      const req = {
        headers: {},
        query: {
          token,
          userId: userId,
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
      expect(await get(redisKey)).toBeUndefined();
      expect(res.cookie).toHaveBeenCalledWith(tokenCookieName, jwt, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it("pulls the JWT from redis with the given token and userId, adds the bearer token to the request headers, deletes the token from redis, sets a cookie with none, and calls next", async () => {
      const token = "testToken";
      const jwt = "testJwt";
      const userId = "testUserId";

      jest.spyOn(config, "getConfig").mockReturnValue({
        AUTHORIZATION_TOKEN_COOKIE_SAMESITE: "none",
      });

      const redisKey = `${userId}-${token}`;

      await set(redisKey, jwt);

      expect(await get(redisKey)).toEqual(jwt);

      const req = {
        headers: {},
        query: {
          token,
          userId: userId,
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
      expect(await get(redisKey)).toBeUndefined();
      expect(res.cookie).toHaveBeenCalledWith(tokenCookieName, jwt, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it("responds with a 401 if there is no JWT in redis", async () => {
      const token = "testToken";

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
      expect(app.get).toHaveBeenCalledTimes(1);
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
      expect(app.get).toHaveBeenCalledTimes(1);
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
