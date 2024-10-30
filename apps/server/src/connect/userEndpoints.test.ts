import type { Response } from "express";
import { getAggregatorAdapter } from "../adapterIndex";
// import { http, HttpResponse } from "msw";
import type { Aggregator } from "../shared/contract";
import { Aggregators } from "../shared/contract";
import { listUsersData } from "../test/testData/users";
// import { server } from "../test/testServer";
import { invalidAggregatorString } from "../utils/validators";
import type { UserDeleteRequest } from "./userEndpoints";
import { userDeleteHandler } from "./userEndpoints";

const user = listUsersData.users[0];

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

    it("responds with 204 on success with TestA", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: Aggregators.TEST_A,
          userId: user.id,
        },
      };

      await userDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("responds with a failure if TestA deletion fails", async () => {
      // Mock DeleteUser from TestAdapter
      jest
        .spyOn(getAggregatorAdapter(Aggregators.TEST_A), "DeleteUser")
        .mockImplementation(() => {
          throw new Error("User delete failed");
        });

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: Aggregators.TEST_A,
          userId: user.id,
        },
      };

      await userDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("User delete failed");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
