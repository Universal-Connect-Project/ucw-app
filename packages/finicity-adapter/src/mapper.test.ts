import {
  mapTransaction,
  mapAccount,
  transformAccountsToCustomers,
} from "./mapper";

import nameParser from "parse-full-name";

describe("mapper", () => {
  describe("mapTransaction", () => {
    it("maps a debit transaction to the correct structure", () => {
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

    it("maps a credit transaction to the correct structure", () => {
      const transaction = {
        id: "12345",
        amount: 100.0,
        type: "dividend",
        postedDate: 1609459200,
        transactionDate: 1609459200,
        description: "Fidelity dividends",
        memo: "Dividend",
        accountId: 1,
        customerId: 1,
        status: "POSTED",
        createdDate: 1609459200,
        categorization: {
          normalizedPayeeName: "Fidelity",
          category: "Dividend",
          bestRepresentation: "Fidelity Deposit",
          country: "USA",
        },
      };

      const accountId = "account123";

      const result = mapTransaction(transaction, accountId);

      expect(result).toEqual({
        investmentTransaction: {
          amount: 100.0,
          accountId: "account123",
          transactionId: "12345",
          postedTimestamp: expect.any(Date),
          transactionTimestamp: expect.any(Date),
          description: "Fidelity dividends",
          debitCreditMemo: "CREDIT",
          memo: "Dividend",
          category: "Dividend",
          status: "POSTED",
          payee: "Fidelity",
        },
      });
    });
  });

  describe("mapAccount", () => {
    const baseAccount = {
      id: "baseAccountId",
      type: "checking",
      number: "987654321",
      accountNumberDisplay: "4321",
      name: "Base Account",
      balance: 1000,
      status: "active",
      customerId: "customer123",
      institutionId: "institution123",
      balanceDate: 1609459200,
      aggregationAttemptDate: 1609459200,
      createdDate: 1609459200,
      linkedAccountDate: 1609459200,
      currency: "USD",
      accountNickname: "Base Account Nickname",
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

    it("maps a deposit account to the correct structure", () => {
      const result = mapAccount(baseAccount);

      expect(result).toEqual({
        depositAccount: {
          accountId: "baseAccountId",
          accountCategory: "DEPOSIT_ACCOUNT",
          accountType: "checking",
          accountNumber: "987654321",
          routingTransitNumber: "123456789",
          accountNumberDisplay: "4321",
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "ASSET",
          nickname: "Base Account Nickname",
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

    it("maps a loan account to the correct structure", () => {
      const loanAccount = {
        ...baseAccount,
        type: "loan",
        name: "Loan Account",
        accountNickname: "Loan Account Nickname",
        balance: -5000,
        detail: {
          principalBalance: 5000,
          termOfMl: "24 months",
        },
      };

      const result = mapAccount(loanAccount);

      expect(result).toEqual({
        loanAccount: {
          accountId: "baseAccountId",
          accountCategory: "LOAN_ACCOUNT",
          accountType: "loan",
          accountNumber: "987654321",
          routingTransitNumber: "123456789",
          accountNumberDisplay: "4321",
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "LIABILITY",
          nickname: "Loan Account Nickname",
          currentBalance: -5000,
          balanceAsOf: expect.any(Date),
          availableBalance: undefined,
          principalBalance: 5000,
          loanTerm: "24 months",
        },
      });
    });

    it("maps an investment account to the correct structure", () => {
      const investmentAccount = {
        ...baseAccount,
        type: "investment",
        name: "Investment Account",
        accountNickname: "Investment Account Nickname",
        balance: 20000,
        detail: undefined,
      };

      const result = mapAccount(investmentAccount);

      expect(result).toEqual({
        investmentAccount: {
          accountId: "baseAccountId",
          accountCategory: "INVESTMENT_ACCOUNT",
          accountType: "investment",
          accountNumber: "987654321",
          routingTransitNumber: "123456789",
          accountNumberDisplay: "4321",
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "ASSET",
          nickname: "Investment Account Nickname",
          currentBalance: 20000,
          balanceAsOf: expect.any(Date),
          availableBalance: undefined,
        },
      });
    });

    it("handles an account with missing details gracefully", () => {
      const accountWithMissingDetails = {
        ...baseAccount,
        type: "checking",
        detail: undefined,
        achDetails: undefined,
        number: undefined,
        accountNumberDisplay: undefined,
      };

      const result = mapAccount(accountWithMissingDetails);

      expect(result).toEqual({
        depositAccount: {
          accountId: "baseAccountId",
          accountCategory: "DEPOSIT_ACCOUNT",
          accountType: "checking",
          accountNumber: undefined,
          routingTransitNumber: undefined,
          accountNumberDisplay: undefined,
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "ASSET",
          nickname: "Base Account Nickname",
          currentBalance: 1000,
          balanceAsOf: expect.any(Date),
          availableBalance: undefined,
        },
      });
    });

    it("handles an unknown account type with the default case", () => {
      const unknownAccount = {
        ...baseAccount,
        type: "unknownType",
        detail: {
          availableBalanceAmount: 800,
        },
      };

      const result = mapAccount(unknownAccount);

      expect(result).toEqual({
        depositAccount: {
          accountId: "baseAccountId",
          accountCategory: "DEPOSIT_ACCOUNT",
          accountType: "unknownType",
          accountNumber: "987654321",
          routingTransitNumber: "123456789",
          accountNumberDisplay: "4321",
          status: "active",
          currency: { currencyCode: "USD" },
          balanceType: "ASSET",
          nickname: "Base Account Nickname",
          currentBalance: 1000,
          balanceAsOf: expect.any(Date),
          availableBalance: 800,
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
          currency: "USD",
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

    it("handles accounts with no holders", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "checking",
          holders: [],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result).toEqual({
        customers: [
          {
            customerId: "customer123",
            name: { first: undefined, last: undefined },
            addresses: [],
            emails: [],
            telephones: [],
            accounts: [{ accountId: "account123" }],
          },
        ],
      });
    });

    it("handles duplicate addresses", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "pension",
          holders: [
            {
              ownerName: "John Doe",
              addresses: [
                { ownerAddress: "123 Main St" },
                { ownerAddress: "123 Main St" },
              ],
            },
          ],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result.customers[0].addresses.length).toBe(1);
    });

    it("falls back to full name as first name if parsing fails", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "pension",
          holders: [
            {
              ownerName: "SingleName",
              addresses: [],
            },
          ],
        },
      ];

      jest.spyOn(nameParser, "parseFullName").mockImplementation(() => {
        throw new Error("Parsing error");
      });

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result.customers[0].name).toEqual({
        first: "SingleName",
        last: undefined,
      });
    });

    it("handles invalid addresses gracefully", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "variableAnnuity",
          holders: [
            {
              ownerName: "John Doe",
              addresses: [
                { ownerAddress: "Invalid Address" },
                { ownerAddress: "72 CHRISTIE STREET SALT LAKE CITY, UT 84103" },
              ],
            },
          ],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result.customers[0].addresses).toEqual([
        {
          line1: "Invalid Address",
        },
        {
          line1: "72 Christie St",
          city: "Salt Lake City",
          state: "Utah",
          postalCode: "84103",
        },
      ]);
    });

    it("handles multiple holders with different addresses", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "creditCard",
          holders: [
            {
              ownerName: "John Doe",
              addresses: [{ ownerAddress: "123 Main St" }],
            },
            {
              ownerName: "Jane Doe",
              addresses: [{ ownerAddress: "456 Elm St" }],
            },
          ],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result.customers[0].addresses).toEqual([
        { line1: "123 Main St" },
        { line1: "456 Elm St" },
      ]);
    });

    it("handles accounts with no addresses", () => {
      const accountsWithHolders = [
        {
          customerId: "customer123",
          id: "account123",
          type: "loan",
          holders: [
            {
              ownerName: "John Doe",
              addresses: [],
            },
          ],
        },
      ];

      const result = transformAccountsToCustomers(accountsWithHolders);

      expect(result.customers[0].addresses).toEqual([]);
    });
  });
});
