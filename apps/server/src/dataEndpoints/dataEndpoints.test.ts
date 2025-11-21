import type { Request, Response } from "express";
import {
  createAccountsDataHandler,
  createIdentityDataHandler,
  createTransactionsDataHandler,
  connectionIdHeaderRequiredMessage,
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
          query: {
            aggregator: MX_AGGREGATOR_STRING,
            userId: "junk",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request,
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
          query: {
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
    });

    it("responds with the vc data in the jwt on success", async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await vcAccountsDataHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        jwt: mxVcAccountsData,
      });
    });

    it("responds with the failure when connectionId is missing", async () => {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {},
      } as unknown as Request;

      await createAccountsDataHandler(false)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        "UCW-Connection-Id header is required",
      );
    });

    it("responds with the data on success", async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createAccountsDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(getDataFromVCJwt(mxVcAccountsData));
    });

    it("responds with the failure when connectionId is missing", async () => {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {},
      } as unknown as Request;

      await createAccountsDataHandler(false)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(connectionIdHeaderRequiredMessage);
    });

    it("responds with a failure when userId is missing for non-plaid aggregators", async () => {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          // userId is missing
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createAccountsDataHandler(false)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.stringMatching(/userId.*required/),
      );
    });

    it("responds with a success when userId is missing for plaid aggregators", async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: "plaid_sandbox" as Aggregator,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createAccountsDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accounts: expect.any(Array),
        }),
      );
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
          query: {
            aggregator: MX_AGGREGATOR_STRING,
            userId: "junk",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request,
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
          query: {
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request,
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

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

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

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createIdentityDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(getDataFromVCJwt(mxVcIdentityData));
    });

    it("responds with the failure when connectionId is missing", async () => {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
          userId: userIdThatExists,
        },
        headers: {},
      } as unknown as Request;

      await createIdentityDataHandler(false)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(connectionIdHeaderRequiredMessage);
    });

    it("responds with a failure when userId is missing for non-plaid aggregators", async () => {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: MX_AGGREGATOR_STRING,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createIdentityDataHandler(false)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.stringMatching(/userId.*required/),
      );
    });

    it("responds with a success when userId is missing for plaid aggregators", async () => {
      const res = {
        json: jest.fn(),
      } as unknown as Response;

      const req = {
        query: {
          aggregator: "plaid_sandbox" as Aggregator,
        },
        headers: {
          "UCW-Connection-Id": "testConnectionId",
        },
      } as unknown as Request;

      await createIdentityDataHandler(false)(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          customers: expect.any(Array),
        }),
      );
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
            query: {
              accountId: "testAccountId",
              aggregator: MX_AGGREGATOR_STRING,
              userId: "junk",
            },
            headers: {
              "UCW-Connection-Id": "testConnectionId",
            },
          } as unknown as Request,
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

        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: "junk" as Aggregator,
            userId: "testUserId",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        await vcTransactionsDataHandler(req, res);

        expect(res.send).toHaveBeenCalledWith(invalidAggregatorString);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it("responds with the vc data in the jwt on success", async () => {
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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

        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        await createTransactionsDataHandler(false)(req, res);

        expect(res.json).toHaveBeenCalledWith(
          getDataFromVCJwt(mxVcTranscationsData),
        );
      });

      it("fails if missing required accountId", async () => {
        const req = {
          query: {
            aggregator: SOPHTRON_ADAPTER_NAME,
            userId: "testUserId",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any;

        await createTransactionsDataHandler(true)(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.stringMatching(/accountId.*required/),
        );
      });

      it("accepts valid ISO 8601 startDate and endDate", async () => {
        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2021-01-01",
            endDate: "2022-01-01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("accepts only valid startDate", async () => {
        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2021-01-01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("accepts only valid endDate", async () => {
        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            endDate: "2022-01-01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("rejects if startDate is not ISO 8601", async () => {
        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2021/01/01",
            endDate: "2022-01-01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2021-01-01",
            endDate: "2022/01/01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2021/01/01",
            endDate: "2022/01/01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as unknown as Response;

        await vcTransactionsDataHandler(req, res);
        expect(res.status).not.toHaveBeenCalledWith(400);
      });

      it("rejects if startDate is empty string", async () => {
        const req = {
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "",
            endDate: "2022-01-01",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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
          query: {
            accountId: "testAccountId",
            aggregator: MX_AGGREGATOR_STRING,
            userId: userIdThatExists,
            startDate: "2022-01-01",
            endDate: "",
          },
          headers: {
            "UCW-Connection-Id": "testConnectionId",
          },
        } as unknown as Request;

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
