import {
  mapPlaidTransactionToFdx,
  formatDateForPlaid,
  PlaidTransaction,
} from "./transactions";
import {
  DepositTransactionType,
  LoanTransactionType,
  LocTransactionType,
  InvestmentTransactionType,
  DebitCreditMemo,
  TransactionStatus,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";
import { plaidTransactionsResponseExample } from "@repo/utils-dev-dependency/plaid/testData";

describe("mapPlaidTransactionToFdx", () => {
  describe("depository account transactions", () => {
    it("maps a basic deposit transaction correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -100,
        payment_channel: "other",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.DEPOSIT,
      );
      expect(result.depositTransaction.amount).toBe(100);
      expect(result.depositTransaction.debitCreditMemo).toBe(
        DebitCreditMemo.CREDIT,
      );
      expect(result.depositTransaction.status).toBe(TransactionStatus.POSTED);
      expect(result.depositTransaction.description).toBe(plaidTransaction.name);
    });

    it("maps a check transaction with check number", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        check_number: "1234",
        amount: 50,
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.CHECK,
      );
      expect(result.depositTransaction.checkNumber).toBe(1234);
    });

    it("maps an interest income transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -5.5,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_INTEREST_EARNED",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.INTEREST,
      );
      expect(result.depositTransaction.amount).toBe(5.5);
    });

    it("maps a dividend income transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -10,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_DIVIDENDS",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.DIVIDEND,
      );
    });

    it("maps a direct deposit (wages) transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -1000,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_WAGES",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.DIRECTDEPOSIT,
      );
    });

    it("maps an ATM deposit correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -200,
        payment_channel: "in store",
        personal_finance_category: {
          primary: "TRANSFER_IN",
          detailed: "TRANSFER_IN_DEPOSIT",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.ATMDEPOSIT,
      );
    });

    it("maps an ATM withdrawal correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 100,
        payment_channel: "in store",
        personal_finance_category: {
          primary: "TRANSFER_OUT",
          detailed: "TRANSFER_OUT_WITHDRAWAL",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.ATMWITHDRAWAL,
      );
    });

    it("maps a transfer in transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -150,
        personal_finance_category: {
          primary: "TRANSFER_IN",
          detailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.TRANSFER,
      );
    });

    it("maps a bill payment transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 75,
        personal_finance_category: {
          primary: "LOAN_PAYMENTS",
          detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.BILLPAYMENT,
      );
    });

    it("maps a bank fee transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 10,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_ATM_FEES",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.FEE,
      );
    });

    it("maps a POS debit transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 25.5,
        payment_channel: "in store",
        personal_finance_category: {
          primary: "FOOD_AND_DRINK",
          detailed: "FOOD_AND_DRINK_RESTAURANTS",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.transactionType).toBe(
        DepositTransactionType.POSDEBIT,
      );
    });

    it("includes payee information when available", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[1],
        payment_meta: {
          ...plaidTransactionsResponseExample.transactions[1].payment_meta,
          payee: "Test Payee",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.payee).toBe("Test Payee");
    });

    it("uses merchant_name as payee when payment_meta.payee is not available", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[1],
        merchant_name: "United Airlines",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.payee).toBe("United Airlines");
    });
  });

  describe("credit account transactions", () => {
    it("maps a credit card purchase transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 78.5,
        personal_finance_category: {
          primary: "PERSONAL_CARE",
          detailed: "PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS",
          confidence_level: "LOW",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.PURCHASE,
      );
      expect(result.locTransaction.amount).toBe(78.5);
      expect(result.locTransaction.debitCreditMemo).toBe(DebitCreditMemo.DEBIT);
    });

    it("maps a credit card payment transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -100,
        personal_finance_category: {
          primary: "LOAN_PAYMENTS",
          detailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.PAYMENT,
      );
    });

    it("maps a credit card check transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        check_number: "5678",
        amount: 50,
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.CHECK,
      );
      expect(result.locTransaction.checkNumber).toBe(5678);
    });

    it("maps a credit card withdrawal transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 100,
        personal_finance_category: {
          primary: "TRANSFER_OUT",
          detailed: "TRANSFER_OUT_WITHDRAWAL",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.WITHDRAWAL,
      );
    });

    it("maps a credit card interest charge", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 25,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_INTEREST_CHARGE",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.INTEREST,
      );
    });

    it("maps a credit card fee", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 15,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_OVERDRAFT_FEES",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.FEE,
      );
    });
  });

  describe("loan account transactions", () => {
    it("maps a loan payment transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -500,
        personal_finance_category: {
          primary: "LOAN_PAYMENTS",
          detailed: "LOAN_PAYMENTS_MORTGAGE_PAYMENT",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "loan",
      }) as unknown as { loanTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("loanTransaction");
      expect(result.loanTransaction.transactionType).toBe(
        LoanTransactionType.PAYMENT,
      );
      expect(result.loanTransaction.amount).toBe(500);
      expect(result.loanTransaction.debitCreditMemo).toBe(
        DebitCreditMemo.CREDIT,
      );
    });

    it("maps a loan interest charge", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 50,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_INTEREST_CHARGE",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "loan",
      }) as unknown as { loanTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("loanTransaction");
      expect(result.loanTransaction.transactionType).toBe(
        LoanTransactionType.INTEREST,
      );
    });

    it("maps a loan fee", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 25,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_OTHER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "loan",
      }) as unknown as { loanTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("loanTransaction");
      expect(result.loanTransaction.transactionType).toBe(
        LoanTransactionType.FEE,
      );
    });

    it("maps a transfer in as loan payment", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -300,
        personal_finance_category: {
          primary: "TRANSFER_IN",
          detailed: "TRANSFER_IN_ACCOUNT_TRANSFER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "loan",
      }) as unknown as { loanTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("loanTransaction");
      expect(result.loanTransaction.transactionType).toBe(
        LoanTransactionType.PAYMENT,
      );
    });
  });

  describe("investment account transactions", () => {
    it("maps a dividend transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -50,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_DIVIDENDS",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.DIVIDEND,
      );
      expect(result.investmentTransaction.amount).toBe(50);
    });

    it("maps an interest income transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -10,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_INTEREST_EARNED",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.INTEREST,
      );
    });

    it("maps a contribution transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -1000,
        personal_finance_category: {
          primary: "TRANSFER_IN",
          detailed: "TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.CONTRIBUTION,
      );
    });

    it("maps a transfer out transaction", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 500,
        personal_finance_category: {
          primary: "TRANSFER_OUT",
          detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.TRANSFER,
      );
    });

    it("maps an investment fee", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: 20,
        personal_finance_category: {
          primary: "BANK_FEES",
          detailed: "BANK_FEES_OTHER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.FEE,
      );
    });

    it("maps general income correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        amount: -75,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_OTHER",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "investment",
      }) as unknown as { investmentTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("investmentTransaction");
      expect(result.investmentTransaction.transactionType).toBe(
        InvestmentTransactionType.INCOME,
      );
    });
  });

  describe("transaction status and timestamps", () => {
    it("maps pending transactions correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        pending: true,
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.status).toBe(TransactionStatus.PENDING);
    });

    it("maps posted transactions correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        pending: false,
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.status).toBe(TransactionStatus.POSTED);
    });

    it("uses datetime when available for timestamps", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        datetime: "2025-11-15T14:30:00Z",
        authorized_datetime: "2025-11-14T10:00:00Z",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.postedTimestamp).toBe(
        "2025-11-15T14:30:00Z",
      );
      expect(result.depositTransaction.transactionTimestamp).toBe(
        "2025-11-14T10:00:00Z",
      );
    });

    it("falls back to date when datetime is not available", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        datetime: null,
        authorized_datetime: null,
        date: "2025-11-15",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.postedTimestamp).toBe(
        "2025-11-15T12:00:00Z",
      );
      expect(result.depositTransaction.transactionTimestamp).toBe(
        "2025-11-15T12:00:00Z",
      );
    });
  });

  describe("FI attributes", () => {
    it("includes all required FI attributes", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[1],
        transaction_id: "test-txn-123",
        account_id: "test-acct-456",
        merchant_entity_id: "merchant-789",
        payment_channel: "online",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");

      const fiAttributes = result.depositTransaction.fiAttributes || [];
      expect(fiAttributes).toContainEqual({
        name: "plaid_transaction_id",
        value: "test-txn-123",
      });
      expect(fiAttributes).toContainEqual({
        name: "plaid_account_id",
        value: "test-acct-456",
      });
      expect(fiAttributes).toContainEqual({
        name: "merchant_entity_id",
        value: "merchant-789",
      });
      expect(fiAttributes).toContainEqual({
        name: "payment_channel",
        value: "online",
      });
    });

    it("includes personal finance category attributes", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        personal_finance_category: {
          primary: "FOOD_AND_DRINK",
          detailed: "FOOD_AND_DRINK_RESTAURANTS",
          confidence_level: "HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      const fiAttributes = result.depositTransaction.fiAttributes || [];
      expect(fiAttributes).toContainEqual({
        name: "plaid_category_primary",
        value: "FOOD_AND_DRINK",
      });
      expect(fiAttributes).toContainEqual({
        name: "plaid_category_detailed",
        value: "FOOD_AND_DRINK_RESTAURANTS",
      });
    });

    it("includes pending_transaction_id when present", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        pending_transaction_id: "pending-123",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");

      const fiAttributes = result.depositTransaction.fiAttributes || [];
      expect(fiAttributes).toContainEqual({
        name: "pending_transaction_id",
        value: "pending-123",
      });
    });
  });

  describe("category and subcategory mapping", () => {
    it("includes category and subcategory from personal finance category", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        personal_finance_category: {
          primary: "TRAVEL",
          detailed: "TRAVEL_FLIGHTS",
          confidence_level: "VERY_HIGH",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.category).toBe("TRAVEL");
      expect(result.depositTransaction.subCategory).toBe("TRAVEL_FLIGHTS");
    });
  });

  describe("memo and description fields", () => {
    it("maps description, memo, and reference fields correctly", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        name: "Coffee Shop Purchase",
        merchant_name: "United Airlines",
        payment_meta: {
          ...plaidTransactionsResponseExample.transactions[0].payment_meta,
          reference_number: "REF-12345",
        },
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.description).toBe(
        "Coffee Shop Purchase",
      );
      expect(result.depositTransaction.memo).toBe("United Airlines");
      expect(result.depositTransaction.reference).toBe("REF-12345");
    });
  });

  describe("account ID handling", () => {
    it("uses provided accountId parameter when specified", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        account_id: "original-account-id",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountId: "custom-account-id",
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.accountId).toBe("custom-account-id");
    });

    it("falls back to transaction.account_id when accountId not provided", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
        account_id: "original-account-id",
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
        accountType: "depository",
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
      expect(result.depositTransaction.accountId).toBe("original-account-id");
    });
  });

  describe("account type default", () => {
    it("defaults to depository when no type information available", () => {
      const plaidTransaction: PlaidTransaction = {
        ...plaidTransactionsResponseExample.transactions[0],
      };

      const result = mapPlaidTransactionToFdx({
        transaction: plaidTransaction,
      }) as unknown as { depositTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("depositTransaction");
    });
  });

  describe("test data from plaidTransactionsResponseExample", () => {
    it("transforms the first transaction (Touchstone Climbing) correctly", () => {
      const transaction = plaidTransactionsResponseExample.transactions[0];

      const result = mapPlaidTransactionToFdx({
        transaction: transaction as PlaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionId).toBe(
        "5vVN5waoqofVALBQJKVeIq18AyWrXgc51apax",
      );
      expect(result.locTransaction.amount).toBe(78.5);
      expect(result.locTransaction.description).toBe("Touchstone Climbing");
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.PURCHASE,
      );
      expect(result.locTransaction.status).toBe(TransactionStatus.POSTED);
    });

    it("transforms the second transaction (United Airlines) correctly", () => {
      const transaction = plaidTransactionsResponseExample.transactions[1];

      const result = mapPlaidTransactionToFdx({
        transaction: transaction as PlaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.transactionId).toBe(
        "JMbzVGWEoEI6lZ7W8Q6nSAPG5NqRwaSBDl5ld",
      );
      expect(result.locTransaction.amount).toBe(500);
      expect(result.locTransaction.description).toBe("United Airlines");
      expect(result.locTransaction.memo).toBe("United Airlines");
    });

    it("transforms the automatic payment transaction correctly", () => {
      const transaction = plaidTransactionsResponseExample.transactions[3];

      const result = mapPlaidTransactionToFdx({
        transaction: transaction as PlaidTransaction,
        accountType: "credit",
      }) as unknown as { locTransaction: { [key: string]: unknown } };

      expect(result).toHaveProperty("locTransaction");
      expect(result.locTransaction.amount).toBe(2078.5);
      expect(result.locTransaction.description).toBe(
        "AUTOMATIC PAYMENT - THANK",
      );
      expect(result.locTransaction.transactionType).toBe(
        LocTransactionType.PURCHASE,
      );
      expect(result.locTransaction.debitCreditMemo).toBe(DebitCreditMemo.DEBIT);
    });
  });
});

describe("formatDateForPlaid", () => {
  it("formats a date correctly for Plaid API", () => {
    const date = new Date("2025-11-15T14:30:00Z");
    const result = formatDateForPlaid(date);
    expect(result).toBe("2025-11-15");
  });

  it("handles dates at different times of day consistently", () => {
    const morningDate = new Date("2025-01-01T08:00:00Z");
    const eveningDate = new Date("2025-01-01T20:00:00Z");

    expect(formatDateForPlaid(morningDate)).toBe("2025-01-01");
    expect(formatDateForPlaid(eveningDate)).toBe("2025-01-01");
  });

  it("handles leap year dates correctly", () => {
    const leapDate = new Date("2024-02-29T12:00:00Z");
    const result = formatDateForPlaid(leapDate);
    expect(result).toBe("2024-02-29");
  });
});
