import { transformPlaidAccountsToFdx } from "./accounts";
import type { PlaidAccount, PlaidAccountsResponse } from "./accounts";
import {
  authResponse,
  accountsResponse,
  checkingAccount,
  savingsAccount,
  cdAccount,
  creditCardAccount,
  moneyMarketAccount,
  iraAccount,
  investment401kAccount,
  studentLoanAccount,
  mortgageAccount,
  hsaAccount,
} from "@repo/utils-dev-dependency/plaid/testData/accounts";
import {
  AccountCategory,
  AccountSubType,
  AccountStatus,
  BalanceType,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";

const createSingleAccountResponse = ({
  account: account,
  includeNumbers: includeNumbers = false,
}: {
  account: PlaidAccount;
  includeNumbers?: boolean;
}): PlaidAccountsResponse => ({
  accounts: [account],
  item: {
    institution_id: "test_institution_id",
    institution_name: "Test Bank",
    item_id: "test_item_id",
  },
  ...(includeNumbers && {
    numbers: {
      ach: [
        {
          account: "1234567890123456",
          account_id: account.account_id,
          is_tokenized_account_number: false,
          routing: "123456789",
          wire_routing: "987654321",
        },
      ],
      bacs: [],
      eft: [],
      international: [],
    },
  }),
  request_id: "test_request_id",
});

describe("transformPlaidAccountsToFdx", () => {
  describe("individual account types", () => {
    it("should transform checking account correctly", () => {
      const response = createSingleAccountResponse({
        account: checkingAccount,
        includeNumbers: true,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.depositAccount).toEqual(
        expect.objectContaining({
          accountId: checkingAccount.account_id,
          accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
          accountType: AccountSubType.CHECKING,
          accountNumberDisplay: `****${checkingAccount.mask}`,
          productName: checkingAccount.official_name,
          nickname: checkingAccount.name,
          status: AccountStatus.OPEN,
          currentBalance: checkingAccount.balances.current,
          availableBalance: checkingAccount.balances.available,
          currency: expect.objectContaining({
            currencyCode: checkingAccount.balances.iso_currency_code,
          }),
          balanceType: BalanceType.ASSET,
          accountNumber: "1234567890123456",
          routingTransitNumber: "123456789",
          fiAttributes: expect.arrayContaining([
            { name: "plaidAccountId", value: checkingAccount.account_id },
          ]),
        }),
      );
    });

    it("should transform savings account correctly", () => {
      const response = createSingleAccountResponse({
        account: savingsAccount,
        includeNumbers: true,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.depositAccount).toEqual(
        expect.objectContaining({
          accountType: AccountSubType.SAVINGS,
          nickname: savingsAccount.name,
          currentBalance: savingsAccount.balances.current,
          accountNumber: "1234567890123456",
          routingTransitNumber: "123456789",
        }),
      );
    });

    it("should transform CD account correctly", () => {
      const response = createSingleAccountResponse({ account: cdAccount });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];
      expect(account.depositAccount).toEqual(
        expect.objectContaining({
          accountType: AccountSubType.CD,
          currentBalance: cdAccount.balances.current,
          availableBalance: 0,
        }),
      );
    });

    it("should transform credit card account correctly", () => {
      const response = createSingleAccountResponse({
        account: creditCardAccount,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.locAccount).toEqual(
        expect.objectContaining({
          accountCategory: AccountCategory.LOC_ACCOUNT,
          accountType: AccountSubType.CREDITCARD,
          currentBalance: creditCardAccount.balances.current,
          creditLine: creditCardAccount.balances.limit,
          balanceType: BalanceType.LIABILITY,
        }),
      );
    });

    it("should transform money market account correctly", () => {
      const response = createSingleAccountResponse({
        account: moneyMarketAccount,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.depositAccount).toEqual(
        expect.objectContaining({
          accountType: AccountSubType.MONEYMARKET,
          currentBalance: moneyMarketAccount.balances.current,
        }),
      );
    });

    it("should transform IRA investment account correctly", () => {
      const response = createSingleAccountResponse({ account: iraAccount });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];
      expect(account.investmentAccount).toEqual(
        expect.objectContaining({
          accountCategory: AccountCategory.INVESTMENT_ACCOUNT,
          accountType: AccountSubType.IRA,
          currentValue: iraAccount.balances.current,
          balanceType: BalanceType.ASSET,
        }),
      );
    });

    it("should transform 401k investment account correctly", () => {
      const response = createSingleAccountResponse({
        account: investment401kAccount,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];
      expect(account.investmentAccount).toEqual(
        expect.objectContaining({
          accountType: AccountSubType._401K,
          currentValue: investment401kAccount.balances.current,
        }),
      );
    });

    it("should transform student loan account correctly", () => {
      const response = createSingleAccountResponse({
        account: studentLoanAccount,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.loanAccount).toEqual(
        expect.objectContaining({
          accountCategory: AccountCategory.LOAN_ACCOUNT,
          accountType: AccountSubType.STUDENTLOAN,
          principalBalance: studentLoanAccount.balances.current,
          balanceType: BalanceType.LIABILITY,
        }),
      );
    });

    it("should transform mortgage loan account correctly", () => {
      const response = createSingleAccountResponse({
        account: mortgageAccount,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.loanAccount).toEqual(
        expect.objectContaining({
          accountCategory: AccountCategory.LOAN_ACCOUNT,
          accountType: AccountSubType.MORTGAGE,
          principalBalance: mortgageAccount.balances.current,
        }),
      );
    });

    it("should transform HSA account correctly", () => {
      const response = createSingleAccountResponse({ account: hsaAccount });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0];

      expect(account.depositAccount).toEqual(
        expect.objectContaining({
          accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
          accountType: AccountSubType.SAVINGS,
          nickname: "Plaid HSA",
        }),
      );
    });
  });

  describe("full response validation", () => {
    it("should transform full accounts response with correct account type distribution", () => {
      const result = transformPlaidAccountsToFdx(accountsResponse);

      expect(result.accounts).toHaveLength(12);

      const depositAccounts = result.accounts.filter(
        (acc) => acc.depositAccount,
      ).length;
      const locAccounts = result.accounts.filter(
        (acc) => acc.locAccount,
      ).length;
      const loanAccounts = result.accounts.filter(
        (acc) => acc.loanAccount,
      ).length;
      const investmentAccounts = result.accounts.filter(
        (acc) => acc.investmentAccount,
      ).length;

      expect(depositAccounts).toBe(6); // checking, savings, cd, money market, hsa, cash management
      expect(locAccounts).toBe(2); // personal credit card, business credit card
      expect(loanAccounts).toBe(2); // student loan, mortgage
      expect(investmentAccounts).toBe(2); // ira, 401k
    });

    it("should include correct institution metadata and a valid ISO balanceAsOf for all accounts", () => {
      const result = transformPlaidAccountsToFdx(accountsResponse);

      result.accounts.forEach((account) => {
        const fdxAccount =
          account.depositAccount ||
          account.locAccount ||
          account.loanAccount ||
          account.investmentAccount;

        const plaidItemId = fdxAccount?.fiAttributes?.find(
          (attr) => attr.name === "plaidItemId",
        );
        const plaidInstitutionId = fdxAccount?.fiAttributes?.find(
          (attr) => attr.name === "plaidInstitutionId",
        );
        const plaidInstitutionName = fdxAccount?.fiAttributes?.find(
          (attr) => attr.name === "plaidInstitutionName",
        );

        expect(plaidItemId?.value).toBe(
          "vLQngyqJK4IKeyKjw9kdtMjKAAjWxeIWnlevz",
        );
        expect(plaidInstitutionId?.value).toBe("ins_109512");
        expect(plaidInstitutionName?.value).toBe("Houndstooth Bank");

        if ("balanceAsOf" in fdxAccount!) {
          expect(new Date(fdxAccount.balanceAsOf!).toISOString()).toBe(
            fdxAccount.balanceAsOf,
          );
        }
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty accounts array", () => {
      const emptyResponse: PlaidAccountsResponse = {
        ...authResponse,
        accounts: [],
      };

      const result = transformPlaidAccountsToFdx(emptyResponse);
      expect(result.accounts).toHaveLength(0);
    });

    it("should handle unknown account subtypes gracefully", () => {
      const responseWithUnknownSubtype: PlaidAccountsResponse = {
        ...authResponse,
        accounts: [
          {
            ...authResponse.accounts[0],
            subtype: "unknown_subtype" as PlaidAccount["subtype"],
          },
        ],
      };

      const result = transformPlaidAccountsToFdx(responseWithUnknownSubtype);

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].depositAccount?.accountType).toBe(
        AccountSubType.OTHERDEPOSIT,
      );
    });

    it("should handle accounts with missing optional fields", () => {
      const minimalAccount: PlaidAccountsResponse = {
        accounts: [
          {
            account_id: "test123",
            balances: {
              available: null,
              current: null,
              iso_currency_code: "USD",
              limit: null,
              unofficial_currency_code: null,
            },
            mask: "1234",
            name: "Test Account",
            official_name: null,
            subtype: "checking",
            type: "depository",
          },
        ],
        item: {
          institution_id: "test_inst",
          institution_name: "Test Bank",
          item_id: "test_item",
        },
        request_id: "test_request",
      };

      const result = transformPlaidAccountsToFdx(minimalAccount);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0].depositAccount!;
      expect(account).toEqual(
        expect.objectContaining({
          currentBalance: 0,
          availableBalance: 0,
          productName: null,
          accountNumber: undefined,
          routingTransitNumber: undefined,
        }),
      );
    });

    it("should handle accounts without account numbers gracefully", () => {
      const responseWithoutNumbers = createSingleAccountResponse({
        account: checkingAccount,
      });
      delete responseWithoutNumbers.numbers;

      const result = transformPlaidAccountsToFdx(responseWithoutNumbers);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0].depositAccount!;

      expect(account.accountNumber).toBeUndefined();
      expect(account.routingTransitNumber).toBeUndefined();
      expect(account.accountId).toBe(checkingAccount.account_id);
    });

    it("should handle null and undefined balance values correctly", () => {
      const accountWithNullBalances = {
        ...checkingAccount,
        balances: {
          ...checkingAccount.balances,
          available: null,
          current: null,
        },
      };

      const response = createSingleAccountResponse({
        account: accountWithNullBalances,
      });
      const result = transformPlaidAccountsToFdx(response);

      expect(result.accounts).toHaveLength(1);
      const account = result.accounts[0].depositAccount!;

      expect(account.currentBalance).toBe(0);
      expect(account.availableBalance).toBe(0);
    });
  });
});
