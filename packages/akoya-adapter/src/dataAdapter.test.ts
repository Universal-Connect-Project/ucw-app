import 'dotenv/config'
import { VCDataTypes } from "@repo/utils";
import type { VCDependencies } from "./models";
import { logClient } from "./test/utils/logClient";
import { aggregatorCredentials } from "./adapter.test";
import { createAkoyaSandboxDataAdapter, createAkoyaProdDataAdapter } from "./dataAdapter";

const dependencies: VCDependencies = {
  logClient,
  aggregatorCredentials,
  envConfig: process.env
};

describe("getData", () => {
  const institutionId = "mikomo";
  const userId = '{"id_token": "userId"}';
  const accountId = "839502593";

  it("gets accounts Data from Sandbox environment", async () => {
    const Data = await createAkoyaSandboxDataAdapter(dependencies)({
      connectionId: institutionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
      aggregator: 'akoya_sandbox'
    });
    expect(Data).toEqual({
        "accounts": [
          {
            "investmentAccount": {
              "accountId": "839502593",
              "accountType": "College Savings",
              "balanceType": "ASSET",
              "currency": {
                "currencyCode": "USD"
              },
              "nickname": "529 for Kid"
            }
          },
          {
            "depositAccount": {
              "accountId": "33fbd9e5-9cc3-3d7d-15b3-70d97d87ca1d",
              "accountType": "SAVINGS",
              "balanceType": "ASSET",
              "currency": {
                "currencyCode": "USD",
                "originalCurrencyCode": "USD"
              },
              "description": "Savings",
              "fiAttributes": [
                {
                  "name": "eStatements",
                  "value": "True"
                }
              ],
              "interestRate": 0.01,
              "lineOfBusiness": "CONSUMER",
              "nickname": "Savings - 8537",
              "parentAccountId": "33fbd9e5-9cc3-3d7d-15b3-70d97d87ca1d",
              "status": "OPEN",
              "transactionsIncluded": false
            }
          }
        ]
    });
  });

  it("gets identity Data from Sandbox environment", async () => {
    const Data = await createAkoyaSandboxDataAdapter(dependencies)({
      connectionId: institutionId,
      accountId,
      type: VCDataTypes.IDENTITY,
      userId,
      aggregator: 'akoya_sandbox'
    });
    expect(Data).toEqual({
          customers: [
            {
              "customerId": "string",
              "name": {
                "first": "string",
                "middle": "string",
                "last": "string",
                "prefix": "string",
                "suffix": "string",
                "company": "string"
              },
              "businessCustomer": {
                "name": "string",
                "registeredAgents": [
                  {
                    "first": "string",
                    "middle": "string",
                    "last": "string",
                    "prefix": "string",
                    "suffix": "string",
                    "company": "string"
                  }
                ],
                "registeredId": "string",
                "industryCode": {
                  "type": "string",
                  "code": "string"
                },
                "domicile": {
                  "region": "string",
                  "country": "string"
                }
              },
              "addresses": [
                {
                  "line1": "string",
                  "line2": "string",
                  "line3": "string",
                  "city": "string",
                  "state": "string",
                  "region": "string",
                  "postalCode": "string",
                  "country": "string",
                  "type": "string"
                }
              ],
              "telephones": [
                {
                  "number": "string",
                  "type": "HOME",
                  "country": "string"
                }
              ],
              "email": [
                "string"
              ],
              "accounts": [
                {
                  "accountId": "string",
                  "relationship": "AUTHORIZED_USER"
                }
              ]
            }
          ]
    });
  });

  it("gets transactions Data from Prod environment", async () => {
    const Data = await createAkoyaProdDataAdapter(dependencies)({
      connectionId: institutionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      aggregator: 'akoya_sandbox'
    });
    expect(Data).toEqual({
        "transactions": [
          {
            "depositTransaction": {
              "accountId": "33fbd9e5-9cc3-3d7d-15b3-70d97d87ca1d",
              "amount": 0.29,
              "debitCreditMemo": "CREDIT",
              "description": "Interest Paid This Period",
              "postedTimestamp": "2021-01-27T00:00:00Z",
              "status": "POSTED",
              "transactionId": "22ef95ee-6127-382d-a28c-5b8b7a15d2eb",
              "transactionTimestamp": "2021-01-27T00:00:00Z",
              "transactionType": "INTEREST"
            }
          },
          {
            "depositTransaction": {
              "accountId": "33fbd9e5-9cc3-3d7d-15b3-70d97d87ca1d",
              "amount": 0.13,
              "debitCreditMemo": "CREDIT",
              "description": "Interest Paid This Period",
              "postedTimestamp": "2021-02-24T00:00:00Z",
              "status": "POSTED",
              "transactionId": "f3fced9d-a7a2-4194-5a17-a2a9b09ff64a",
              "transactionTimestamp": "2021-02-24T00:00:00Z",
              "transactionType": "INTEREST"
            }
          }
        ],
    });
  });
});
