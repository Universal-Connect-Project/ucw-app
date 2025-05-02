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
import { accountsData } from "./test/testData/accounts";

const dependencies: DataAdapterDependencies = {
  logClient: createLogClient(),
  cacheClient: createCacheClient(),
  aggregatorCredentials,
  envConfig: process.env,
  getWebhookHostUrl: () => "testWebhookHostUrl",
};

describe("dataAdapter", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("retrieves accounts data", async () => {
    const data = await createFinicitySandboxDataAdapter(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });

    expect(data).toEqual({
      accounts: [
        {
          depositAccount: {
            accountCategory: "DEPOSIT_ACCOUNT",
            accountId: "7079364532",
            accountNumber: 2345678901,
            accountNumberDisplay: "8901",
            accountType: "checking",
            availableBalance: 14911,
            balanceAsOf: expect.any(Date),
            balanceType: "ASSET",
            currency: {
              currencyCode: "USD",
            },
            currentBalance: 14911,
            nickname: "Checking",
            routingTransitNumber: "123456789",
            status: "active",
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

    const data = await createFinicityProdDataAdapter(dependencies)({
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
    const data = await createFinicityProdDataAdapter(dependencies)({
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
});
