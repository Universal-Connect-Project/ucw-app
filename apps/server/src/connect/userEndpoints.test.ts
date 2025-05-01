import type { Response } from "express";
import type { Aggregator } from "../shared/contract";
import { Aggregators } from "../shared/contract";
import { listUsersData } from "../test/testData/users";
import { invalidAggregatorString } from "../utils/validators";
import type { UserDeleteRequest } from "./userEndpoints";
import { userDeleteHandler } from "./userEndpoints";
import * as adapterIndex from "../adapterIndex";
import type { WidgetAdapter } from "@repo/utils";

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
      const deleteFailedMessage = "User Delete Failed";

      jest
        .spyOn(adapterIndex, "createAggregatorWidgetAdapter")
        .mockReturnValue({
          DeleteUser: () => {
            throw new Error(deleteFailedMessage);
          },
          ResolveUserId: () => "test",
        } as unknown as WidgetAdapter);

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: Aggregators.TEST_A,
          userId: user.id,
        },
      };

      await userDeleteHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: deleteFailedMessage,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
