import "dotenv/config";
import type { DataAdapterDependencies } from "./models";
import { VCDataTypes } from "@repo/utils";
import {
  createPlaidSandboxDataAdapter,
  createPlaidProdDataAdapter,
} from "./dataAdapter";
import {
  AccountStatus,
  type FdxAccountsResponse,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";
import { createClient as createCacheClient } from "@repo/utils/test";
import { createLogClient } from "@repo/utils-dev-dependency";
import { http, HttpResponse } from "msw";
import { server } from "./test/testServer";
import { PLAID_BASE_PATH, PLAID_BASE_PATH_PROD } from "./apiClient";
import {
  authResponse,
  accountsResponse,
  checkingAccount,
  creditCardAccount,
  iraAccount,
} from "@repo/utils-dev-dependency/plaid/testData/accounts";

const aggregatorCredentials = {
  plaidSandbox: {
    clientName: "test-clientName",
    clientId: "test-clientId",
    secret: "test-app-secret",
  },
  plaidProd: {
    clientName: "prod-test-clientName",
    clientId: "prod-test-clientId",
    secret: "prod-test-app-secret",
  },
};

const mockLogClient = createLogClient();

const dependencies: DataAdapterDependencies = {
  logClient: mockLogClient,
  cacheClient: createCacheClient(),
  aggregatorCredentials,
  envConfig: process.env,
  getWebhookHostUrl: () => "testWebhookHostUrl",
};

const sandboxDataAdapter = createPlaidSandboxDataAdapter(dependencies);
const prodDataAdapter = createPlaidProdDataAdapter(dependencies);

describe("dataAdapter", () => {
  const connectionId = "access_token_test_123";
  const userId = "userId";
  const accountId = "accountId";

  describe("ACCOUNTS data type", () => {
    it("retrieves accounts data with auth info (sandbox)", async () => {
      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect((data as FdxAccountsResponse).accounts).toBeDefined();
      // The 3 accounts from /auth overlap with the 12 from /accounts, so total is 12 not 15
      expect((data as FdxAccountsResponse).accounts).toHaveLength(12);

      const firstAccount = (data as FdxAccountsResponse).accounts[0];

      expect(firstAccount).toEqual({
        depositAccount: {
          accountCategory: "DEPOSIT_ACCOUNT",
          accountId: checkingAccount.account_id,
          accountType: "CHECKING",
          accountNumber: "1111222233330000",
          accountNumberDisplay: "****0000",
          balanceAsOf: expect.any(String),
          balanceType: "ASSET",
          availableBalance: 100,
          currentBalance: 110,
          routingTransitNumber: "011401533",
          currency: {
            currencyCode: "USD",
          },
          fiAttributes: [
            {
              name: "plaidAccountId",
              value: checkingAccount.account_id,
            },
            {
              name: "plaidItemId",
              value: authResponse.item.item_id,
            },
            {
              name: "plaidInstitutionId",
              value: authResponse.item.institution_id,
            },
            {
              name: "plaidInstitutionName",
              value: "Houndstooth Bank",
            },
          ],
          nickname: "Plaid Checking",
          productName: "Plaid Gold Standard 0% Interest Checking",
          status: AccountStatus.OPEN,
        },
      });
    });

    it("retrieves accounts data without auth info when auth fails", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, () => {
          return HttpResponse.json(accountsResponse);
        }),
        http.post(`${PLAID_BASE_PATH}/auth/get`, () => {
          return HttpResponse.json(
            {
              error_type: "INVALID_REQUEST",
              error_code: "INVALID_PRODUCT",
              error_message: "the following products are not available: [auth]",
            },
            { status: 400 },
          );
        }),
      );

      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(data).toEqual({
        accounts: expect.arrayContaining([
          {
            depositAccount: expect.objectContaining({
              accountId: checkingAccount.account_id,
              accountType: "CHECKING",
              accountNumber: undefined,
              routingTransitNumber: undefined,
              nickname: checkingAccount.name,
            }),
          },
        ]),
      });

      expect(data).toBeDefined();
      expect((data as FdxAccountsResponse)?.accounts).toHaveLength(12);
    });

    it("retrieves diverse account types correctly", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, () => {
          return HttpResponse.json(accountsResponse);
        }),
        http.post(`${PLAID_BASE_PATH}/auth/get`, () => {
          return HttpResponse.json(
            {
              error_type: "INVALID_REQUEST",
              error_code: "INVALID_PRODUCT",
              error_message: "auth not available",
            },
            { status: 400 },
          );
        }),
      );

      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      // Should have correct distribution of account types
      expect(data).toBeDefined();
      const fdxData = data as FdxAccountsResponse;
      const depositAccounts =
        fdxData.accounts?.filter((acc) => acc.depositAccount) || [];
      const locAccounts =
        fdxData.accounts?.filter((acc) => acc.locAccount) || [];
      const loanAccounts =
        fdxData.accounts?.filter((acc) => acc.loanAccount) || [];
      const investmentAccounts =
        fdxData.accounts?.filter((acc) => acc.investmentAccount) || [];

      expect(depositAccounts).toHaveLength(6); // checking, savings, cd, money market, hsa, cash management
      expect(locAccounts).toHaveLength(2); // personal credit card, business credit card
      expect(loanAccounts).toHaveLength(2); // student loan, mortgage
      expect(investmentAccounts).toHaveLength(2); // ira, 401k

      const creditCard = fdxData.accounts?.find(
        (acc) => acc.locAccount?.accountId === creditCardAccount.account_id,
      );
      expect(creditCard?.locAccount).toEqual(
        expect.objectContaining({
          accountType: "CREDITCARD",
          accountCategory: "LOC_ACCOUNT",
          balanceType: "LIABILITY",
        }),
      );

      const ira = fdxData.accounts?.find(
        (acc) => acc.investmentAccount?.accountId === iraAccount.account_id,
      );
      expect(ira?.investmentAccount).toEqual(
        expect.objectContaining({
          accountType: "IRA",
          accountCategory: "INVESTMENT_ACCOUNT",
        }),
      );
    });

    it("uses production endpoint for prod adapter", async () => {
      let requestPath = "";
      server.use(
        http.post(`${PLAID_BASE_PATH_PROD}/accounts/get`, ({ request }) => {
          requestPath = request.url;
          return HttpResponse.json(authResponse);
        }),
        http.post(`${PLAID_BASE_PATH_PROD}/auth/get`, () => {
          return HttpResponse.json(authResponse);
        }),
      );

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(requestPath).toContain(PLAID_BASE_PATH_PROD);
    });
  });

  describe("error handling", () => {
    it("throws error when credentials are missing", async () => {
      const badDependencies: DataAdapterDependencies = {
        ...dependencies,
        aggregatorCredentials: {
          plaidSandbox: {}, // Missing clientId and secret
        },
      };

      const badAdapter = createPlaidSandboxDataAdapter(badDependencies);

      await expect(
        badAdapter({
          connectionId,
          type: VCDataTypes.ACCOUNTS,
          userId,
        }),
      ).rejects.toThrow("Plaid credentials not found");
    });

    it("throws error for unimplemented IDENTITY data type", async () => {
      await expect(
        sandboxDataAdapter({
          connectionId,
          type: VCDataTypes.IDENTITY,
          userId,
        }),
      ).rejects.toThrow("Identity data type not implemented yet");
    });

    it("throws error for unimplemented TRANSACTIONS data type", async () => {
      await expect(
        sandboxDataAdapter({
          connectionId,
          type: VCDataTypes.TRANSACTIONS,
          userId,
          accountId,
        }),
      ).rejects.toThrow("Transactions data type not implemented yet");
    });
  });

  describe("request validation", () => {
    it("sends correct request parameters for accounts", async () => {
      let requestBody: unknown = null;
      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(authResponse);
        }),
        http.post(`${PLAID_BASE_PATH}/auth/get`, () => {
          return HttpResponse.json(authResponse);
        }),
      );

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(requestBody).toEqual({
        access_token: connectionId,
        client_id: aggregatorCredentials.plaidSandbox.clientId,
        secret: aggregatorCredentials.plaidSandbox.secret,
      });
    });

    it("sends correct request parameters for auth", async () => {
      let authRequestBody: unknown = null;
      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, () => {
          return HttpResponse.json(authResponse);
        }),
        http.post(`${PLAID_BASE_PATH}/auth/get`, async ({ request }) => {
          authRequestBody = await request.json();
          return HttpResponse.json(authResponse);
        }),
      );

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(authRequestBody).toEqual({
        access_token: connectionId,
        client_id: aggregatorCredentials.plaidSandbox.clientId,
        secret: aggregatorCredentials.plaidSandbox.secret,
      });
    });
  });

  describe("logging", () => {
    it("logs debug messages for account fetching", async () => {
      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(mockLogClient.debug).toHaveBeenCalledWith(
        `Fetching accounts data for connection: ${connectionId}`,
      );
    });

    it("logs debug messages when auth fails", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, () => {
          return HttpResponse.json(authResponse);
        }),
        http.post(`${PLAID_BASE_PATH}/auth/get`, () => {
          return HttpResponse.json(
            { error_type: "INVALID_REQUEST", error_code: "INVALID_PRODUCT" },
            { status: 400 },
          );
        }),
      );

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId,
      });

      expect(mockLogClient.debug).toHaveBeenCalledWith(
        expect.stringContaining("Could not fetch account numbers"),
      );
    });
  });
});
