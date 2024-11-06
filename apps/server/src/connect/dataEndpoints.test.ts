import type { Response } from "express";
import * as adapterIndex from "../adapterIndex";
import {
  testVcAccountsData,
  testVcIdentityData,
  testVcTranscationsData,
} from "../test/testData/testVcData";
import type {
  AccountsRequest,
  IdentityRequest,
  TransactionsRequest,
} from "./dataEndpoints";
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

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("accountsDataHandler", () => {
    it("responds with a failure if aggregator isn't valid", async () => {
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

    it("responds with the vc data in the jwt on success", async () => {
      const res = {
        send: jest.fn(),
      } as unknown as Response;

      const req: AccountsRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await accountsDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        jwt: testVcAccountsData,
      });
    });

    it("responds with a 400 on failure", async () => {
      jest.spyOn(adapterIndex, "getVC").mockImplementation(() => {
        throw new Error();
      });

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: AccountsRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await accountsDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("Something went wrong");
      expect(res.status).toHaveBeenCalledWith(400);
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
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
    });

    it("responds with the vc data in the jwt on success", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: IdentityRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await identityDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        jwt: testVcIdentityData,
      });
    });

    it("responds with a 400 on failure", async () => {
      jest.spyOn(adapterIndex, "getVC").mockImplementation(() => {
        throw new Error();
      });

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: IdentityRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await identityDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith("Something went wrong");
      expect(res.status).toHaveBeenCalledWith(400);
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

      it("doesn't respond with a 400 if it's TestAdapterA and there is no start or end time", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: Aggregators.TEST_A,
            userId: "testUserId",
          },
          query: {
            end_time: undefined,
            start_time: undefined,
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("responds with a 400 if its sophtron and there is no start time", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: Aggregators.SOPHTRON,
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
        jest.spyOn(adapterIndex, "getVC").mockImplementation(() => {
          throw new Error();
        });

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: Aggregators.SOPHTRON,
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

      it("responds with the vc data in the jwt on success", async () => {
        jest
          .spyOn(adapterIndex, "getVC")
          .mockImplementationOnce(async () => testVcTranscationsData);

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: Aggregators.TEST_A,
            userId: "testUserId",
          },
          query: {
            start_time: undefined,
            end_time: undefined,
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith({
          jwt: testVcTranscationsData,
        });
      });

      it("responds with a 400 on failure", async () => {
        jest.spyOn(adapterIndex, "getVC").mockImplementation(() => {
          throw new Error();
        });

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: Aggregators.TEST_A,
            userId: "testUserId",
          },
          query: {
            start_time: undefined,
            end_time: undefined,
          },
        };

        await transactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith("Something went wrong");
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });
});
