import "dotenv/config";
import type { DataAdapterDependencies } from "./models";
import { aggregatorCredentials } from "./adapter.test";
import { VCDataTypes } from "@repo/utils";
import {
  createFinicitySandboxDataAdapter,
  createFinicityProdDataAdapter,
} from "./dataAdapter";
import {
  createClient as createCacheClient,
  createLogClient,
} from "@repo/utils/test";
import { http, HttpResponse } from "msw";
import { server } from "./test/testServer";
import { BASE_PATH } from "./apiClient";
import {
  accountAchData,
  accountsData,
  accountTransactionsData,
} from "./test/testData/accounts";

const dependencies: DataAdapterDependencies = {
  logClient: createLogClient(),
  cacheClient: createCacheClient(),
  aggregatorCredentials,
  envConfig: process.env,
  getWebhookHostUrl: () => "testWebhookHostUrl",
};

const sandboxDataAdapter = createFinicitySandboxDataAdapter(dependencies);
const prodDataAdapter = createFinicityProdDataAdapter(dependencies);

describe("dataAdapter", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("retrieves accounts data", async () => {
    const data = await sandboxDataAdapter({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });

    expect(data).toEqual({
      accounts: [
        {
          depositAccount: {
            accountCategory: "DEPOSIT_ACCOUNT",
            accountId: accountsData.accounts[0].id,
            accountNumber: accountAchData.realAccountNumber,
            accountNumberDisplay: accountsData.accounts[0].accountNumberDisplay,
            accountType: accountsData.accounts[0].type,
            availableBalance:
              accountsData.accounts[0].detail.availableBalanceAmount,
            balanceAsOf: expect.any(Date),
            balanceType: "ASSET",
            currency: {
              currencyCode: accountsData.accounts[0].currency,
            },
            currentBalance: accountsData.accounts[0].balance,
            nickname: accountsData.accounts[0].accountNickname,
            routingTransitNumber: accountAchData.routingNumber,
            status: accountsData.accounts[0].status,
          },
        },
        {
          depositAccount: {
            accountCategory: "DEPOSIT_ACCOUNT",
            accountId: accountsData.accounts[1].id,
            accountNumber: accountAchData.realAccountNumber,
            accountNumberDisplay: accountsData.accounts[1].accountNumberDisplay,
            accountType: accountsData.accounts[1].type,
            availableBalance:
              accountsData.accounts[1].detail.availableBalanceAmount,
            balanceAsOf: expect.any(Date),
            balanceType: "ASSET",
            currency: {
              currencyCode: accountsData.accounts[1].currency,
            },
            currentBalance: accountsData.accounts[1].balance,
            nickname: accountsData.accounts[1].accountNickname,
            routingTransitNumber: accountAchData.routingNumber,
            status: accountsData.accounts[1].status,
          },
        },
      ],
    });
  });

  it("retrieves accounts data when account type does not support ACH", async () => {
    server.use(
      http.get(
        `${BASE_PATH}/aggregation/v1/customers/${userId}/institutionLogins/${connectionId}/accounts`,
        () =>
          HttpResponse.json({
            accounts: [
              {
                id: "account123",
                type: "investment",
                balance: 5000,
                status: "active",
                currency: "USD",
                balanceDate: 1609459200,
                accountNumberDisplay: "1234",
                name: "Investment Account",
              },
            ],
          }),
      ),
    );

    const data = await sandboxDataAdapter({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });

    expect(data).toEqual({
      accounts: [
        {
          investmentAccount: {
            accountId: "account123",
            accountCategory: "INVESTMENT_ACCOUNT",
            accountType: "investment",
            accountNumber: undefined,
            routingTransitNumber: undefined,
            accountNumberDisplay: "1234",
            status: "active",
            currency: { currencyCode: "USD" },
            balanceType: "ASSET",
            nickname: "Investment Account",
            currentBalance: 5000,
            balanceAsOf: expect.any(Date),
            availableBalance: undefined,
          },
        },
      ],
    });
  });

  it("retrieves identity data", async () => {
    server.use(
      http.get(
        `${BASE_PATH}/aggregation/v1/customers/${userId}/institutionLogins/${connectionId}/accounts`,
        () =>
          HttpResponse.json({
            accounts: [
              {
                ...accountsData.accounts[0],
                id: accountId,
                customerId: userId,
              },
            ],
          }),
      ),
      http.get(
        `${BASE_PATH}/aggregation/v3/customers/${userId}/accounts/${accountId}/owner`,
        () =>
          HttpResponse.json({
            holders: [
              {
                ownerName: "John Smith",
                nameClassification: "person",
                nameClassificationconfidencescore: 0.9991,
                addresses: [
                  {
                    ownerAddress: "72 CHRISTIE STREET SALT LAKE CITY, UT 84103",
                  },
                ],
              },
            ],
          }),
      ),
    );

    const data = await prodDataAdapter({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });

    expect(data).toEqual({
      customers: [
        {
          addresses: [
            {
              line1: "72 Christie St",
              city: "Salt Lake City",
              state: "Utah",
              postalCode: "84103",
            },
          ],
          customerId: userId,
          name: {
            first: "John",
            last: "Smith",
          },
          accounts: [
            {
              accountId,
            },
          ],
          emails: [],
          telephones: [],
        },
      ],
    });
  });

  it("retrieves transactions data", async () => {
    const data = await prodDataAdapter({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });

    expect(data).toEqual({
      transactions: [
        {
          depositTransaction: {
            amount: 828.9,
            accountId,
            transactionId: "21284820852",
            postedTimestamp: expect.any(Date),
            transactionTimestamp: expect.any(Date),
            description: "Buy Stock",
            debitCreditMemo: "DEBIT",
            memo: "UWM HOLDINGS CORPORATION - CLASS A COMMON STOCK",
            category: "ATM Fee",
            status: "active",
            payee: "Mad Science Research",
          },
        },
        {
          depositTransaction: {
            amount: 4791.46,
            accountId,
            transactionId: "34918483438",
            postedTimestamp: expect.any(Date),
            transactionTimestamp: expect.any(Date),
            description: "ABC LTD",
            debitCreditMemo: "CREDIT",
            memo: "ACH CREDIT",
            category: "Deposit",
            status: "active",
            payee: "Abc Ltd",
          },
        },
      ],
    });
  });

  describe("getPreparedDateRangeParams (transactions date params)", () => {
    let requestFromDate: string | undefined;
    let requestToDate: string | undefined;

    beforeEach(() => {
      requestFromDate = undefined;
      requestToDate = undefined;
      server.use(
        http.get(
          `${BASE_PATH}/aggregation/v4/customers/${userId}/accounts/${accountId}/transactions`,
          ({ request }) => {
            const url = new URL(request.url);
            requestFromDate = url.searchParams.get("fromDate") ?? undefined;
            requestToDate = url.searchParams.get("toDate") ?? undefined;
            return HttpResponse.json(accountTransactionsData);
          },
        ),
      );
    });

    it("uses provided valid ISO date strings (YYYY-MM-DD)", async () => {
      const startDate = "2022-01-01";
      const endDate = "2022-02-01";
      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate,
        endDate,
      });
      expect(requestFromDate).toBe(
        String(Math.floor(new Date(startDate).getTime() / 1000)),
      );
      expect(requestToDate).toBe(
        String(Math.floor(new Date(endDate).getTime() / 1000)),
      );
    });

    it("defaults fromDate to 120 days ago if startDate is not provided", async () => {
      const endDate = "2022-02-01";
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 120);
      const expectedFrom = String(Math.floor(daysAgo.getTime() / 1000));

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        endDate,
      });
      expect(requestFromDate).toBe(expectedFrom);
      expect(requestToDate).toBe(
        String(Math.floor(new Date(endDate).getTime() / 1000)),
      );
    });

    it("defaults toDate to now if endDate is not provided", async () => {
      const startDate = "2022-01-01";
      const nowUnix = Math.floor(Date.now() / 1000);

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate,
      });
      expect(requestFromDate).toBe(
        String(Math.floor(new Date(startDate).getTime() / 1000)),
      );
      const toDateNum = Number(requestToDate);
      expect(toDateNum).toBeGreaterThanOrEqual(nowUnix - 5);
      expect(toDateNum).toBeLessThanOrEqual(nowUnix + 5);
    });

    it("defaults both fromDate and toDate if neither are provided", async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 120);
      const expectedFrom = String(Math.floor(daysAgo.getTime() / 1000));
      const nowUnix = Math.floor(Date.now() / 1000);

      await prodDataAdapter({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
      });
      expect(requestFromDate).toBe(expectedFrom);
      const toDateNum = Number(requestToDate);
      expect(toDateNum).toBeGreaterThanOrEqual(nowUnix - 5);
      expect(toDateNum).toBeLessThanOrEqual(nowUnix + 5);
    });

    it("throws if startDate is invalid", async () => {
      await expect(
        prodDataAdapter({
          connectionId,
          type: VCDataTypes.TRANSACTIONS,
          userId,
          accountId,
          startDate: "not-a-date",
        }),
      ).rejects.toThrow("startDate must be a valid ISO 8601 date string");
    });

    it("throws if endDate is invalid", async () => {
      await expect(
        prodDataAdapter({
          connectionId,
          type: VCDataTypes.TRANSACTIONS,
          userId,
          accountId,
          endDate: "not-a-date",
        }),
      ).rejects.toThrow("endDate must be a valid ISO 8601 date string");
    });
  });
});
