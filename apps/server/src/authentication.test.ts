import type { Request, Response } from "express";
import { set as mockSet } from "./__mocks__/redis";
import { getTokenHandler } from "./authentication";

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
});
