import {
  mapTransaction,
  mapAccount,
  transformAccountsToCustomers,
} from "./mapper";

describe("mapper", () => {
  describe("mapTransaction", () => {
    it("maps a transaction to the correct structure", () => {
      const transaction = {
        id: "12345",
        amount: -100.0,
        type: "atm",
        postedDate: 1609459200,
        transactionDate: 1609459200,
        description: "ATM Withdrawal",
        memo: "ATM Fee",
        accountId: 1,
        customerId: 1,
        status: "POSTED",
        createdDate: 1609459200,
        categorization: {
          normalizedPayeeName: "Bank ATM",
          category: "ATM Fee",
          bestRepresentation: "ATM Withdrawal",
          country: "USA",
        },
      };

      const accountId = "account123";

      const result = mapTransaction(transaction, accountId);

      expect(result).toEqual({
        depositTransaction: {
          amount: 100.0,
          accountId: "account123",
          transactionId: "12345",
          postedTimestamp: expect.any(Date),
          transactionTimestamp: expect.any(Date),
          description: "ATM Withdrawal",
          debitCreditMemo: "DEBIT",
          memo: "ATM Fee",
          category: "ATM Fee",
          status: "POSTED",
          payee: "Bank ATM",
        },
      });
    });
  });

  describe("mapAccount", () => {
    it("maps an account to the correct structure", () => {
      const account = {
        id: "12345",
        type: "checking",
        number: "987654321",
        accountNumberDisplay: "4321",
        name: "My Checking Account",
        balance: 1000,
        status: "active",
        customerId: "customer123",
        institutionId: "institution123",
        balanceDate: 1609459200,
        aggregationAttemptDate: 1609459200,
        createdDate: 1609459200,
        linkedAccountDate: 1609459200,
        currency: "USD",
        institutionLoginId: 12345,
        displayPosition: 1,
        accountNickname: "My Checking Account",
        marketSegment: "personal",
        achDetails: {
          realAccountNumber: "987654321",
          routingNumber: "123456789",
        },
        detail: {
          availableBalanceAmount: 800,
          nextPayment: 100,
          nextPaymentDate: 1612137600,
          principalBalance: 500,
          termOfMl: "12 months",
        },
      };

      const result = mapAccount(account);

      expect(result).toEqual({
        depositAccount: {
          accountId: "12345",
          accountCategory: "DEPOSIT_ACCOUNT",
          accountType: "checking",
          accountNumber: "987654321",
          routingTransitNumber: "123456789",
          accountNumberDisplay: "4321",
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "ASSET",
          nickname: "My Checking Account",
          currentBalance: 1000,
          balanceAsOf: expect.any(Date),
          availableBalance: 800,
          nextPaymentAmount: 100,
          nextPaymentDate: expect.any(Date),
          principalBalance: 500,
          loanTerm: "12 months",
        },
      });
    });
  });

  describe("transformAccountsToCustomers", () => {
    it("transforms accounts with holders into customers", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          number: "987654321",
          accountNumberDisplay: "4321",
          name: "My Checking Account",
          accountNickname: "Personal Checking",
          balance: 1000,
          type: "checking",
          status: "active",
          institutionId: "institution123",
          balanceDate: 1609459200,
          aggregationAttemptDate: 1609459200,
          createdDate: 1609459200,
          linkedAccountDate: 1609459200,
          currency: "USD",
          institutionLoginId: 12345,
          displayPosition: 1,
          marketSegment: "personal",
          holders: [
            {
              ownerName: "John Doe",
              emails: [{ email: "john.doe@example.com" }],
              phones: [
                {
                  phone: "1234567890",
                  type: "mobile",
                  country: "US",
                },
              ],
              addresses: [
                {
                  ownerAddress: "72 CHRISTIE STREET SALT LAKE CITY, UT 84103",
                },
              ],
            },
          ],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result).toEqual({
        customers: [
          {
            customerId: "customer123",
            name: {
              first: "John",
              last: "Doe",
            },
            addresses: [
              {
                line1: "72 Christie St",
                city: "Salt Lake City",
                state: "Utah",
                postalCode: "84103",
              },
            ],
            emails: ["john.doe@example.com"],
            telephones: [
              {
                type: "mobile",
                country: "US",
                number: "1234567890",
              },
            ],
            accounts: [
              {
                accountId: "account123",
              },
            ],
          },
        ],
      });
    });
  });
});
