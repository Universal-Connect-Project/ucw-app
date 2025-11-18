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
  type FdxIdentityResponse,
  type FdxTransactionsResponse,
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
import {
  identityResponse,
  plaidTransactionsResponseExample,
} from "@repo/utils-dev-dependency/plaid/testData";

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

  describe("IDENTITY data type", () => {
    it("retrieves identity data and transforms to FDX customers (sandbox)", async () => {
      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.IDENTITY,
        userId,
      });

      expect(data).toBeDefined();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray((data as FdxIdentityResponse).customers)).toBe(true);

      const response = data as FdxIdentityResponse;
      expect(response.customers).toHaveLength(1);

      const customer = response.customers[0];
      expect(customer).toEqual({
        customerId: expect.stringContaining("owner_0"),
        type: "CONSUMER",
        name: {
          first: "Alberta",
          middle: "Bobbeth",
          last: "Charleson",
        },
        email: [
          "accountholder0@example.com",
          "accountholder1@example.com",
          "extraordinarily.long.email.username.123456@reallylonghostname.com",
        ],
        addresses: [
          {
            type: "HOME",
            line1: "2992 Cameron Road",
            city: "Malakoff",
            region: "NY",
            postalCode: "14236",
            country: "US",
          },
          {
            type: "MAILING",
            line1: "2493 Leisure Lane",
            city: "San Matias",
            region: "CA",
            postalCode: "93405-2255",
            country: "US",
          },
        ],
        telephones: [
          {
            type: "HOME",
            number: "1112223333",
          },
          {
            type: "BUSINESS",
            number: "1112224444",
          },
          {
            type: "CELL",
            number: "1112225555",
          },
        ],
        accounts: expect.arrayContaining([
          expect.objectContaining({
            accountId: expect.any(String),
            relationship: "PRIMARY",
            links: expect.arrayContaining([]),
          }),
        ]),
      });

      expect(customer.accounts).toHaveLength(12);
    });

    it("uses production endpoint for prod adapter", async () => {
      let requestPath = "";
      server.use(
        http.post(`${PLAID_BASE_PATH_PROD}/identity/get`, ({ request }) => {
          requestPath = request.url;
          return HttpResponse.json(identityResponse);
        }),
      );

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.IDENTITY,
        userId,
      });

      expect(requestPath).toContain(PLAID_BASE_PATH_PROD);
    });

    it("logs debug messages for identity fetching", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/identity/get`, () => {
          return HttpResponse.json(identityResponse);
        }),
      );

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.IDENTITY,
        userId,
      });

      expect(mockLogClient.debug).toHaveBeenCalledWith(
        `Fetching identity data for connection: ${connectionId}`,
      );
    });

    it("sends correct request parameters to identity endpoint", async () => {
      let identityRequestBody: unknown = null;

      server.use(
        http.post(`${PLAID_BASE_PATH}/identity/get`, async ({ request }) => {
          identityRequestBody = await request.json();
          return HttpResponse.json(identityResponse);
        }),
      );

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.IDENTITY,
        userId,
      });

      expect(identityRequestBody).toEqual({
        access_token: connectionId,
        client_id: aggregatorCredentials.plaidSandbox.clientId,
        secret: aggregatorCredentials.plaidSandbox.secret,
      });
    });
  });

  describe("TRANSACTIONS data type", () => {
    it("retrieves transactions data and transforms to FDX (sandbox)", async () => {
      const startDate = "2025-10-01";
      const endDate = "2025-11-30";

      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate,
        endDate,
      });

      expect(data).toBeDefined();
      expect(data).toHaveProperty("transactions");
      const transactionData = data as FdxTransactionsResponse;
      expect(Array.isArray(transactionData.transactions)).toBe(true);
      expect(transactionData.transactions.length).toBeGreaterThan(0);

      const firstTransaction = transactionData.transactions[0];
      expect(firstTransaction).toHaveProperty("locTransaction");
      if ("locTransaction" in firstTransaction) {
        expect(firstTransaction.locTransaction).toMatchObject({
          accountId: expect.any(String),
          transactionId: expect.any(String),
          amount: expect.any(Number),
          description: expect.any(String),
          status: expect.any(String),
          transactionType: expect.any(String),
        });
      }
    });

    it("sends correct request parameters to transactions endpoint and uses provided date range for transaction requests", async () => {
      let transactionsRequestBody: unknown = null;

      server.use(
        http.post(
          `${PLAID_BASE_PATH}/transactions/get`,
          async ({ request }) => {
            transactionsRequestBody = await request.json();
            return HttpResponse.json({
              ...plaidTransactionsResponseExample,
              transactions: [plaidTransactionsResponseExample.transactions[0]],
            });
          },
        ),
      );

      const startDate = "2025-10-15";
      const endDate = "2025-11-15";

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate,
        endDate,
      });

      expect(transactionsRequestBody).toEqual({
        access_token: connectionId,
        client_id: aggregatorCredentials.plaidSandbox.clientId,
        secret: aggregatorCredentials.plaidSandbox.secret,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          account_ids: [accountId],
        },
      });
    });

    it("defaults to current date as endDate when not provided", async () => {
      let transactionsRequestBody: unknown = null;

      server.use(
        http.post(
          `${PLAID_BASE_PATH}/transactions/get`,
          async ({ request }) => {
            transactionsRequestBody = await request.json();
            return HttpResponse.json({
              ...plaidTransactionsResponseExample,
              transactions: [],
            });
          },
        ),
      );

      const startDate = "2025-10-01";

      await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate,
      });

      const today = new Date().toISOString().split("T")[0];
      expect((transactionsRequestBody as Record<string, string>).end_date).toBe(
        today,
      );
    });

    it("passes accountId to transaction mapper", async () => {
      const customAccountId = "custom-account-123";

      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId: customAccountId,
        startDate: "2025-10-01",
        endDate: "2025-11-30",
      });

      const transactions = (data as FdxTransactionsResponse).transactions;
      transactions.forEach((txn) => {
        expect(txn).toHaveProperty("locTransaction");
        if ("locTransaction" in txn) {
          expect(txn.locTransaction.accountId).toBe(customAccountId);
        }
      });
    });

    it("handles empty transaction list", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/transactions/get`, () => {
          return HttpResponse.json({
            ...plaidTransactionsResponseExample,
            transactions: [],
            total_transactions: 0,
          });
        }),
      );

      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate: "2025-10-01",
        endDate: "2025-11-30",
      });

      expect((data as FdxTransactionsResponse).transactions).toEqual([]);
    });

    it("uses production endpoint for prod adapter", async () => {
      let requestPath = "";
      server.use(
        http.post(`${PLAID_BASE_PATH_PROD}/transactions/get`, ({ request }) => {
          requestPath = request.url;
          return HttpResponse.json({
            ...plaidTransactionsResponseExample,
            transactions: [plaidTransactionsResponseExample.transactions[0]],
          });
        }),
      );

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate: "2025-10-01",
        endDate: "2025-11-30",
      });

      expect(requestPath).toContain(PLAID_BASE_PATH_PROD);
    });

    it("includes all transactions from response", async () => {
      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate: "2025-10-01",
        endDate: "2025-11-30",
      });

      const transactions = (data as FdxTransactionsResponse).transactions;
      // plaidTransactionsResponseExample has 7 transactions
      expect(transactions).toHaveLength(7);
    });

    it("preserves transaction details through transformation", async () => {
      const data = await sandboxDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate: "2025-10-01",
        endDate: "2025-11-30",
      });

      const transactions = (data as FdxTransactionsResponse).transactions;
      const firstPlaidTransaction =
        plaidTransactionsResponseExample.transactions[0];
      const firstTransaction = transactions[0];

      expect(firstTransaction).toHaveProperty("locTransaction");
      if ("locTransaction" in firstTransaction) {
        expect(firstTransaction.locTransaction.transactionId).toBe(
          firstPlaidTransaction.transaction_id,
        );
        expect(firstTransaction.locTransaction.amount).toBe(
          firstPlaidTransaction.amount,
        );
        expect(firstTransaction.locTransaction.description).toBe(
          firstPlaidTransaction.name,
        );
      }
    });

    it("handles API errors properly", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/transactions/get`, () => {
          return HttpResponse.json(
            {
              error_type: "INVALID_REQUEST",
              error_code: "INVALID_ACCESS_TOKEN",
              error_message: "Invalid access token",
            },
            { status: 400 },
          );
        }),
      );

      await expect(
        sandboxDataAdapter({
          connectionId,
          type: VCDataTypes.TRANSACTIONS,
          userId,
          accountId,
          startDate: "2025-10-01",
          endDate: "2025-11-30",
        }),
      ).rejects.toThrow("Invalid access token");
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

    it("handles API errors properly", async () => {
      server.use(
        http.post(`${PLAID_BASE_PATH}/identity/get`, () => {
          return HttpResponse.json(
            {
              error_type: "INVALID_REQUEST",
              error_code: "INVALID_ACCESS_TOKEN",
              error_message: "Invalid access token",
            },
            { status: 400 },
          );
        }),
      );

      await expect(
        sandboxDataAdapter({
          connectionId,
          type: VCDataTypes.IDENTITY,
          userId,
        }),
      ).rejects.toThrow("Invalid access token");
    });
  });

  describe("request validation", () => {
    it("sends correct request parameters for accounts and auth endpoints", async () => {
      let accountsRequestBody: unknown = null;
      let authRequestBody: unknown = null;

      server.use(
        http.post(`${PLAID_BASE_PATH}/accounts/get`, async ({ request }) => {
          accountsRequestBody = await request.json();
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

      expect(accountsRequestBody).toEqual({
        access_token: connectionId,
        client_id: aggregatorCredentials.plaidSandbox.clientId,
        secret: aggregatorCredentials.plaidSandbox.secret,
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
