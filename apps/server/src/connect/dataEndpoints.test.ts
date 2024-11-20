import type { Response } from "express";
import { ConnectApi } from "./connectApi";
import { transactionsResponse } from "../test-adapter/vcResponses";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import {
  testDataValidatorEndTimeError,
  testDataValidatorStartTimeError,
} from "../test-adapter/constants";
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
  createAccountsDataHandler,
  createIdentityDataHandler,
  createTransactionsDataHandler,
} from "./dataEndpoints";
import type { Aggregator } from "../shared/contract";
import { Aggregators } from "../shared/contract";
import { invalidAggregatorString } from "../utils/validators";
import { getDataFromVCJwt } from "@repo/utils";

/* eslint-disable @typescript-eslint/unbound-method */

const vcAccountsDataHandler = createAccountsDataHandler(true);
const vcIdentityDataHandler = createIdentityDataHandler(true);
const vcTransactionsDataHandler = createTransactionsDataHandler(true);

const context = {
  aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
};
let connect: ConnectApi;

describe("dataEndpoints", () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    connect = new ConnectApi({
      context,
    });
    await connect.init();
  });

  describe("accountsDataHandler", () => {
    it("responds with a failure if aggregator isn't valid", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await vcAccountsDataHandler(
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

      await vcAccountsDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        jwt: testVcAccountsData,
      });
    });

    it("responds with the data on success", async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const req: AccountsRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await createAccountsDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(
        getDataFromVCJwt(testVcAccountsData),
      );
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

      await vcAccountsDataHandler(req, res);

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

      await vcIdentityDataHandler(
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

      await vcIdentityDataHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        jwt: testVcIdentityData,
      });
    });

    it("responds with the data on success", async () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      const req: IdentityRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: Aggregators.TEST_A,
          userId: "testUserId",
        },
      };

      await createIdentityDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(
        getDataFromVCJwt(testVcIdentityData),
      );
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

      await vcIdentityDataHandler(req, res);

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

        await vcTransactionsDataHandler(req, res);

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

        await vcTransactionsDataHandler(req, res);

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
            aggregator: "sophtron" as Aggregator,
            userId: "testUserId",
          },
          query: {
            end_time: "junk",
            start_time: undefined,
          },
        };

        await vcTransactionsDataHandler(req, res);

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
            aggregator: "sophtron" as Aggregator,
            userId: "testUserId",
          },
          query: {
            end_time: undefined,
            start_time: "junk",
          },
        };

        await vcTransactionsDataHandler(req, res);

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

        await vcTransactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith({
          jwt: testVcTranscationsData,
        });
      });

      it("responds with the data on success", async () => {
        jest
          .spyOn(adapterIndex, "getVC")
          .mockImplementationOnce(async () => testVcTranscationsData);

        const res = {
          json: jest.fn(),
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

        await createTransactionsDataHandler(false)(req, res);

        expect(res.json).toHaveBeenCalledWith(
          getDataFromVCJwt(testVcTranscationsData),
        );
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

        await vcTransactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith("Something went wrong");
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("returns transaction data, if it passes the transactionValidator", async () => {
        const req = {
          connectApi: connect,
          params: {
            aggregator: Aggregators.TEST_A,
          },
          query: {
            start_time: "testStartTime",
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as any;

        await createTransactionsDataHandler(true)(req, res);

        expect(res.send).toHaveBeenCalledWith({
          jwt: transactionsResponse,
        });
      });

      it("fails aggregator's transactionValidator if start_time is undefined", async () => {
        const req = {
          connectApi: connect,
          params: {
            aggregator: Aggregators.TEST_A,
          },
          query: {
            start_time: undefined,
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as any;

        await createTransactionsDataHandler(false)(req, res);

        expect(res.send).toHaveBeenCalledWith(testDataValidatorStartTimeError);
      });

      it("fails aggregator's transactionValidator if end_time is undefined", async () => {
        const req = {
          connectApi: connect,
          params: {
            aggregator: Aggregators.TEST_A,
          },
          query: {
            start_time: "testStartTime",
            end_time: undefined,
          },
        } as unknown as TransactionsRequest;

        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as any;

        await createTransactionsDataHandler(false)(req, res);

        expect(res.send).toHaveBeenCalledWith(testDataValidatorEndTimeError);
      });
    });
  });
});
