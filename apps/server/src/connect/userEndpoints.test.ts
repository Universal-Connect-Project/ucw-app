import type { Response } from "express";
import type { Aggregator } from "../shared/contract";
import { listUsersData } from "../test/testData/users";
import { invalidAggregatorString } from "../utils/validators";
import type { UserDeleteRequest } from "./userEndpoints";
import {
  userDeleteHandler,
  userConnectionDeleteHandler,
} from "./userEndpoints";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { server } from "../test/testServer";
import { http, HttpResponse } from "msw";
import { MX_DELETE_USER_PATH } from "@repo/utils-dev-dependency";
import { PLAID_AGGREGATOR_STRING } from "@repo/plaid-adapter";
import { PLAID_BASE_PATH_PROD } from "@repo/plaid-adapter/src/apiClient";

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

    it("responds with 204 on success", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: user.id,
        },
      };

      await userDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("responds with a failure if deletion fails", async () => {
      server.use(
        http.delete(
          MX_DELETE_USER_PATH,
          () => new HttpResponse(null, { status: 400 }),
        ),
      );

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const req: UserDeleteRequest = {
        params: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: user.id,
        },
      };

      await userDeleteHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Request failed with status code 400",
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("userConnectionDeleteHandler", () => {
    const connectionId = "test-connection-id";

    it("responds with a 400 on unsupported aggregator", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req = {
        params: {
          aggregator: "unsupportedAggregator" as Aggregator,
          userId: "testUserIdWhichDoesntExist",
          connectionId,
        },
      };

      await userConnectionDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("responds with 204 on success", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req = {
        params: {
          aggregator: PLAID_AGGREGATOR_STRING,
          userId: user.id,
          connectionId,
        },
      };

      await userConnectionDeleteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("responds with a failure if deletion fails", async () => {
      server.use(
        http.post(
          `${PLAID_BASE_PATH_PROD}/item/remove`,
          async () => new HttpResponse(null, { status: 400 }),
        ),
      );

      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const req = {
        params: {
          aggregator: PLAID_AGGREGATOR_STRING,
          userId: user.id,
          connectionId,
        },
      };

      await userConnectionDeleteHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Error removing Item",
      });
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
