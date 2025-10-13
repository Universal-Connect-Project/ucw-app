import type { Response } from "express";
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
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";
import { mxTestData } from "@repo/utils-dev-dependency";
import { SOPHTRON_ADAPTER_NAME } from "@repo/sophtron-adapter/src/constants";

const {
  listUsersData: mxListUsersData,
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcTranscationsData,
} = mxTestData;

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
            userId: "junk",
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
              userId: "junk",
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
            startDate: undefined,
            endDate: undefined,
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
          query: {},
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
          query: {},
        };

        await createTransactionsDataHandler(false)(req, res);

        expect(res.json).toHaveBeenCalledWith(
          getDataFromVCJwt(mxVcTranscationsData),
        );
      });

      it("fails if using deprecated start_time/end_time", async () => {
        const req = {
          params: {
            aggregator: SOPHTRON_ADAPTER_NAME,
          },
          query: {
            start_time: "2021/1/1",
            end_time: "2025/1/5",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(true)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.stringMatching(/start_time/),
        );
      });

      it("accepts valid ISO 8601 startDate and endDate", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2021-01-01",
            endDate: "2022-01-01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("accepts only valid startDate", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2021-01-01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("accepts only valid endDate", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            endDate: "2022-01-01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("rejects if startDate is not ISO 8601", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2021/01/01",
            endDate: "2022-01-01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.stringMatching(/startDate/),
        );
      });

      it("rejects if endDate is not ISO 8601", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2021-01-01",
            endDate: "2022/01/01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.stringMatching(/endDate/));
      });

      it("rejects if both are not ISO 8601", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2021/01/01",
            endDate: "2022/01/01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.stringMatching(/startDate/),
        );
      });

      it("accepts if neither startDate nor endDate are provided", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {},
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("rejects if startDate is empty string", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "",
            endDate: "2022-01-01",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.stringMatching(/startDate/),
        );
      });

      it("rejects if endDate is empty string", async () => {
        const req = {
          params: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          query: {
            startDate: "2022-01-01",
            endDate: "",
          },
        } as unknown as TransactionsRequest;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.stringMatching(/endDate/));
      });
    });
  });
});
