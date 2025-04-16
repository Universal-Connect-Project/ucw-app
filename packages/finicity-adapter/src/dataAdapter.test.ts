import 'dotenv/config'
import type { VCDependencies } from "./models";
import { logClient } from "./test/utils/logClient";
import { aggregatorCredentials } from "./adapter.test";
import { VCDataTypes } from "@repo/utils";
import { createFinicitySandboxDataAdapter, createFinicityProdDataAdapter } from "./dataAdapter";

const dependencies: VCDependencies = {
  logClient,
  aggregatorCredentials,
  envConfig: process.env
};

describe("getVc", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";
  it("is dummy", async () => {
  });
  it("gets accounts VC from Sandbox environment", async () => {
    const vc = await createFinicitySandboxDataAdapter(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId
    });
    expect(vc).toEqual({
      credentialSubject: {
        accounts: [
          {
            "depositAccount": {
              "accountCategory": "DEPOSIT_ACCOUNT",
              "accountId": "5011648377",
              "accountNumber": "2000004444",
              "accountNumberDisplay": "5678",
              "accountType": "checking",
              "availableBalnace": 5678.78,
              "balanceAsOf": new Date('1970-01-19T14:30:50.357Z'),
              "balanceType": "ASSET",
              "currency": {
                "currencyCode": "USD",
              },
              "currentBalance": 401.26,
              "nickname": "Super Checking",
              "status": "active",
            },
          },
        ]
      }
    });
  });

  it("gets identity VC from Prod environment", async () => {
    const vc = await createFinicityProdDataAdapter(dependencies)({
      connectionId,
      accountId,
      type: VCDataTypes.IDENTITY,
      userId
    });
    expect(vc).toEqual({
        "credentialSubject":{
          "customer":{
            "addresses": [
              {
                "line1":{
                  "city": "Murray",
                  "country": "USA",
                  "line1": "434 W Ascension Way",
                  "line2": "Suite #200",
                  "line3": "UT 84123",
                  "ownerAddress": "434 W Ascension Way",
                  "postalCode": "84123",
                "state": "UT",
                "type": "Home",
              },
            },
          ],
          "customerId": "userId",
          "email": [
            "myname@mycompany.com",
          ],
          "name":{
            "first": "John",
            "last": "Smith",
            "middle": "",
            "prefix": "",
            "suffix": "PhD",
          },
          "telephones": undefined,
        },
      },
    });
  });

  it("gets transactions VC from Prod environment", async () => {
    const vc = await createFinicityProdDataAdapter(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId
    });
    expect(vc).toEqual({
      "credentialSubject":{
        "transactions": [
          {
            "depositTransaction":{
              "accountId": "accountId",
              "amount": -828.9,
              "category": undefined,
              "checkNumber": 299,
              "description": "Buy Stock",
              "memo": "UWM HOLDINGS CORPORATION - CLASS A COMMON STOCK",
              "payee": "Mad Science Research",
              "postedTimestamp": 1607450357,
              "status": undefined,
              "transactionId": 21284820852,
              "transactionTimestamp": new Date('1970-01-19T14:30:50.357Z'),
              "transactionType": "atm",
            },
          },
        ],
      },
    });
  });
});
