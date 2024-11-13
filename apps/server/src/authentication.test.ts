import type { Request, Response } from "express";
import { get as mockGet, set as mockSet } from "./__mocks__/redis";
import {
  cookieAuthenticationMiddleware,
  getTokenHandler,
  tokenAuthenticationMiddleware,
  tokenCookieName,
} from "./authentication";
import { get, set } from "./services/storageClient/redis";

describe("authentication", () => {
  describe("getTokenHandler", () => {
    it("stores the authorization header token in redis and responds with the redis key token", async () => {
      const authorizationToken = "test";

      const req = {
        headers: {
          authorization: `Bearer ${authorizationToken}`,
        },
      };
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      await getTokenHandler(req as Request, res);

      const token = mockSet.mock.calls[0][0];

      expect(res.json).toHaveBeenCalledWith({ token });
      expect(token).toBeDefined();
    });
  });

  describe("tokenAuthenticationMiddleware", () => {
    it("pulls the JWT from redis with the given token, adds the bearer token to the request headers, deletes the token from redis, sets a cookie, and calls next", async () => {
      const token = "testToken";
      const jwt = "testJwt";

      await set(token, jwt);

      expect(await get(token)).toEqual(jwt);

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
      expect(mockGet(token)).toBeUndefined();
      expect(res.cookie).toHaveBeenCalledWith(tokenCookieName, jwt, {
        httpOnly: true,
        sameSite: "strict",
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
});
