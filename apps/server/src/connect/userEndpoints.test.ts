import type { Response } from "express";
import type { Aggregator } from "../shared/contract";
import type { UserDeleteRequest } from "./userEndpoints";
import { userDeleteHandler } from "./userEndpoints";
import { invalidAggregatorString } from "../utils/validators";

describe("userEndpoints", () => {
  describe("userDeleteHandler", () => {
    it("responds with a 400 on unsupported aggregator", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: "unsupportedAggregator" as Aggregator,
          userId: "testUserIdWhichDoesntExist",
        },
      };

      await userDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
