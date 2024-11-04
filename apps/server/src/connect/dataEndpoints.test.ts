import type { Response } from "express";
import type { TransactionsRequest } from "./dataEndpoints";
import {
  accountsDataHandler,
  identityDataHandler,
  transactionsDataHandler,
} from "./dataEndpoints";
import type { Aggregator } from "../shared/contract";
import { Aggregators } from "../shared/contract";
import { invalidAggregatorString } from "../utils/validators";

/* eslint-disable @typescript-eslint/unbound-method */

describe("dataEndpoints", () => {
  describe("accountsDataHandler", () => {
    it("responds with a failure if aggregator isnt valid", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await accountsDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
    });
  });

  describe("identityDataHandler", () => {
    it("responds with a failure if aggregator isn't valid", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await identityDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: "junk",
            userId: "testUserId",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
    });
  });

  describe("transactionsDataHandler", () => {
    describe("validation", () => {
      it("responds with a 400 if aggregator is wrong", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
          query: {
            start_time: undefined,
            end_time: undefined,
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("responds with a 400 if its sophtron and there is no start time", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: "sophtron" as Aggregator,
            userId: "testUserId",
          },
          query: {
            end_time: "junk",
            start_time: undefined,
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith(
          "&#x22;start_time&#x22; is required",
        );
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("responds with a 400 if its sophtron and there is no end time", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: "sophtron" as Aggregator,
            userId: "testUserId",
          },
          query: {
            end_time: undefined,
            start_time: "junk",
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith(
          "&#x22;end_time&#x22; is required",
        );
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });
});
