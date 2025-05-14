import type { Response } from "express";
import he from "he";
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
import { invalidAggregatorString } from "../utils/validators";
import { getDataFromVCJwt, USER_NOT_RESOLVED_ERROR_TEXT } from "@repo/utils";
import { userIdNotFound } from "../test-adapter/adapter";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import {
  listUsersData as mxListUsersData,
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcTranscationsData,
  sophtronTestData,
} from "@repo/utils-dev-dependency";
import { SOPHTRON_ADAPTER_NAME } from "@repo/sophtron-adapter/src/constants";

const userIdThatExists = mxListUsersData.users[0].id;

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
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await vcAccountsDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: "",
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_NOT_RESOLVED_ERROR_TEXT,
      });
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
        json: jest.fn(),
      } as unknown as Response;

      const req: AccountsRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
      };

      await vcAccountsDataHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jwt: mxVcAccountsData,
      });
    });

    it("responds with the data on success", async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const req: AccountsRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
      };

      await createAccountsDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(getDataFromVCJwt(mxVcAccountsData));
    });
  });

  describe("identityDataHandler", () => {
    it("responds with a failure if the userId isn't found", async () => {
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await vcIdentityDataHandler(
        {
          params: {
            connectionId: "testConnectionId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdNotFound,
          },
        },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_NOT_RESOLVED_ERROR_TEXT,
      });
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
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const req: IdentityRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
      };

      await vcIdentityDataHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jwt: mxVcIdentityData,
      });
    });

    it("responds with the data on success", async () => {
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const req: IdentityRequest = {
        params: {
          connectionId: "testConnectionId",
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
      };

      await createIdentityDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(getDataFromVCJwt(mxVcIdentityData));
    });
  });

  describe("transactionsDataHandler", () => {
    describe("validation", () => {
      it("responds with a failure if the userId isn't found", async () => {
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(
          {
            params: {
              connectionId: "testConnectionId",
              aggregator: MX_AGGREGATOR_STRING,
              userId: userIdNotFound,
            },
            query: {},
          },
          res,
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          message: USER_NOT_RESOLVED_ERROR_TEXT,
        });
      });

      it("fails if aggregator is invalid", async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn().mockReturnThis(),
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
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            start_time: undefined,
            end_time: undefined,
          },
        };

        await vcTransactionsDataHandler(req, res);

        expect(res.json).toHaveBeenCalledWith({
          jwt: mxVcTranscationsData,
        });
      });

      it("responds with the data on success", async () => {
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            start_time: undefined,
            end_time: undefined,
          },
        };

        await createTransactionsDataHandler(false)(req, res);

        expect(res.json).toHaveBeenCalledWith(
          getDataFromVCJwt(mxVcTranscationsData),
        );
      });

      it("succeeds if there is a custom validator and it passes", async () => {
        const req = {
          params: {
            aggregator: SOPHTRON_ADAPTER_NAME,
          },
          query: {
            start_time: "testStartTime",
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(true)(req, res);

        expect(res.json).toHaveBeenCalledWith({
          jwt: sophtronTestData.sophtronVcTranscationsData,
        });
      });

      it("succeeds if there isn't a custom validator", async () => {
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const req: TransactionsRequest = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
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
            aggregator: SOPHTRON_ADAPTER_NAME,
          },
          query: {
            start_time: undefined,
            end_time: "testEndTime",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(false)(req, res);

        expect(res.json).toHaveBeenCalledWith(
          he.encode('"start_time" is required'),
        );
      });
    });
  });
});
