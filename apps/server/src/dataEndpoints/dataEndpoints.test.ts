import type { Response } from "express";
import he from "he";
import { transactionsResponse } from "../test-adapter/vcResponses";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  testDataRequestValidatorStartTimeError,
} from "../test-adapter/constants";
import * as adapterIndex from "../adapterIndex";
import {
  testVcAccountsData,
  testVcIdentityData,
  testVcTransactionsData,
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
import { getDataFromVCJwt, USER_NOT_RESOLVED_ERROR_TEXT } from "@repo/utils";
import { userIdNotFound } from "../test-adapter/adapter";

const somethingWentWrongErrorText = "Something went wrong";

/* eslint-disable @typescript-eslint/unbound-method */

const vcAccountsDataHandler = createAccountsDataHandler(true);
const vcIdentityDataHandler = createIdentityDataHandler(true);
const vcTransactionsDataHandler = createTransactionsDataHandler(true);

describe("dataEndpoints", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("accountsDataHandler", () => {
    it("responds with a failure if the userId isn't found", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await vcAccountsDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
            userId: userIdNotFound,
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(USER_NOT_RESOLVED_ERROR_TEXT);
    });

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

      expect(res.send).toHaveBeenCalledWith(somethingWentWrongErrorText);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("identityDataHandler", () => {
    it("responds with a failure if the userId isn't found", async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as Response;

      await vcIdentityDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
            userId: userIdNotFound,
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(USER_NOT_RESOLVED_ERROR_TEXT);
    });

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

      expect(res.send).toHaveBeenCalledWith(somethingWentWrongErrorText);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("transactionsDataHandler", () => {
    describe("validation", () => {
      it("responds with a failure if the userId isn't found", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn(),
        } as unknown as Response;

        await vcTransactionsDataHandler(
          {
            params: {
              connectionId: "testConnectionId",
              aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
              userId: userIdNotFound,
            },
            query: {},
          },
          res,
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(USER_NOT_RESOLVED_ERROR_TEXT);
      });

      it("fails if aggregator is invalid", async () => {
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

      it("responds with the vc data in the jwt on success", async () => {
        jest
          .spyOn(adapterIndex, "getVC")
          .mockImplementationOnce(async () => testVcTransactionsData);

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
          jwt: testVcTransactionsData,
        });
      });

      it("responds with the data on success", async () => {
        jest
          .spyOn(adapterIndex, "getVC")
          .mockImplementationOnce(async () => testVcTransactionsData);

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
          getDataFromVCJwt(testVcTransactionsData),
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

        expect(res.send).toHaveBeenCalledWith(somethingWentWrongErrorText);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("succeeds if there is a custom validator and it passes", async () => {
        const req = {
          params: {
            aggregator: Aggregators.TEST_B,
          },
          query: {
            start_time: "testStartTime",
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          send: jest.fn(),
          status: jest.fn(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(true)(req, res);

        expect(res.send).toHaveBeenCalledWith({
          jwt: transactionsResponse,
        });
      });

      it("succeeds if there isn't a custom validator", async () => {
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

      it("fails if a custom validator fails", async () => {
        const req = {
          params: {
            aggregator: Aggregators.TEST_B,
          },
          query: {
            start_time: undefined,
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          send: jest.fn(),
          status: jest.fn(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(false)(req, res);

        expect(res.send).toHaveBeenCalledWith(
          he.encode(testDataRequestValidatorStartTimeError),
        );
      });
    });
  });
});
