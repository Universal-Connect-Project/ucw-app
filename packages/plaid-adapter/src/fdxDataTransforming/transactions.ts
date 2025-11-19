import {
  DepositTransactionType,
  LoanTransactionType,
  LocTransactionType,
  InvestmentTransactionType,
  DebitCreditMemo,
  TransactionStatus,
  FiAttribute,
  TransactionItem,
  DepositTransaction,
  LoanTransaction,
  LocTransaction,
  InvestmentTransaction,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";

export type PlaidAccountType =
  | "investment"
  | "credit"
  | "depository"
  | "loan"
  | "brokerage"
  | "other";

export interface PlaidTransaction {
  account_id: string;
  account_owner: string | null;
  amount: number;
  iso_currency_code: string;
  unofficial_currency_code: string | null;
  check_number: string | null;
  counterparties: Counterparty[];
  date: string;
  datetime: string;
  authorized_date: string;
  authorized_datetime: string;
  location: Location;
  name: string;
  merchant_name: string;
  merchant_entity_id: string;
  logo_url: string;
  website: string;
  payment_meta: PaymentMeta;
  payment_channel: string;
  pending: boolean;
  pending_transaction_id: string | null;
  personal_finance_category: PersonalFinanceCategory;
  personal_finance_category_icon_url: string;
  transaction_id: string;
  transaction_code: string | null;
  transaction_type: string;
  type?: PlaidAccountType;
}

interface Counterparty {
  name: string;
  type: string;
  logo_url: string;
  website: string;
  entity_id: string;
  confidence_level: string;
}

interface Location {
  address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  store_number: string | null;
}

interface PaymentMeta {
  by_order_of: string | null;
  payee: string | null;
  payer: string | null;
  payment_method: string | null;
  payment_processor: string | null;
  ppd_id: string | null;
  reason: string | null;
  reference_number: string | null;
}

interface PersonalFinanceCategory {
  primary: string;
  detailed: string;
  confidence_level: string;
}

const mapPlaidToFdxDepositType = (
  transaction: PlaidTransaction,
): DepositTransactionType => {
  const primary = transaction.personal_finance_category?.primary?.toUpperCase();
  const detailed =
    transaction.personal_finance_category?.detailed?.toUpperCase();
  const amount = transaction.amount;
  const paymentChannel = transaction.payment_channel?.toLowerCase();

  if (transaction.check_number) {
    return DepositTransactionType.CHECK;
  }

  if (primary === "INCOME") {
    if (detailed?.includes("INTEREST")) {
      return DepositTransactionType.INTEREST;
    }
    if (detailed?.includes("DIVIDENDS")) {
      return DepositTransactionType.DIVIDEND;
    }
    if (detailed?.includes("WAGES")) {
      return DepositTransactionType.DIRECTDEPOSIT;
    }
    return DepositTransactionType.DEPOSIT;
  }

  if (primary === "TRANSFER_IN") {
    if (detailed?.includes("DEPOSIT") || detailed?.includes("CASH")) {
      return paymentChannel === "in store"
        ? DepositTransactionType.ATMDEPOSIT
        : DepositTransactionType.DEPOSIT;
    }
    return DepositTransactionType.TRANSFER;
  }

  if (primary === "TRANSFER_OUT") {
    if (detailed?.includes("WITHDRAWAL")) {
      return paymentChannel === "in store"
        ? DepositTransactionType.ATMWITHDRAWAL
        : DepositTransactionType.WITHDRAWAL;
    }
    return DepositTransactionType.TRANSFER;
  }

  if (primary === "LOAN_PAYMENTS") {
    return DepositTransactionType.BILLPAYMENT;
  }

  if (primary === "BANK_FEES") {
    if (detailed?.includes("INTEREST")) {
      return DepositTransactionType.INTEREST;
    }
    return DepositTransactionType.FEE;
  }

  if (["in store", "online"].includes(paymentChannel)) {
    return DepositTransactionType.POSDEBIT;
  }

  return amount < 0
    ? DepositTransactionType.DEPOSIT
    : DepositTransactionType.WITHDRAWAL;
};

const mapPlaidToFdxLocType = (
  transaction: PlaidTransaction,
): LocTransactionType => {
  const primary = transaction.personal_finance_category?.primary?.toUpperCase();
  const detailed =
    transaction.personal_finance_category?.detailed?.toUpperCase();
  const amount = transaction.amount;

  if (transaction.check_number) {
    return LocTransactionType.CHECK;
  }

  if (primary === "TRANSFER_OUT" && detailed?.includes("WITHDRAWAL")) {
    return LocTransactionType.WITHDRAWAL;
  }

  if (primary === "BANK_FEES") {
    if (detailed?.includes("INTEREST")) {
      return LocTransactionType.INTEREST;
    }
    return LocTransactionType.FEE;
  }

  if (
    primary === "TRANSFER_IN" ||
    primary === "INCOME" ||
    primary === "LOAN_PAYMENTS" ||
    amount < 0
  ) {
    return LocTransactionType.PAYMENT;
  }

  return LocTransactionType.PURCHASE;
};

const mapPlaidToFdxLoanType = (
  transaction: PlaidTransaction,
): LoanTransactionType => {
  const primary = transaction.personal_finance_category?.primary?.toUpperCase();
  const detailed =
    transaction.personal_finance_category?.detailed?.toUpperCase();
  const amount = transaction.amount;

  if (primary === "BANK_FEES") {
    if (detailed?.includes("INTEREST")) {
      return LoanTransactionType.INTEREST;
    }
    return LoanTransactionType.FEE;
  }

  if (
    primary === "LOAN_PAYMENTS" ||
    primary === "TRANSFER_IN" ||
    primary === "INCOME" ||
    amount < 0
  ) {
    return LoanTransactionType.PAYMENT;
  }

  return LoanTransactionType.FEE;
};

const mapPlaidToFdxInvestmentType = (
  transaction: PlaidTransaction,
): InvestmentTransactionType => {
  const primary = transaction.personal_finance_category?.primary?.toUpperCase();
  const detailed =
    transaction.personal_finance_category?.detailed?.toUpperCase();
  const amount = transaction.amount;

  if (primary === "INCOME") {
    if (detailed?.includes("DIVIDENDS")) {
      return InvestmentTransactionType.DIVIDEND;
    }
    if (detailed?.includes("INTEREST")) {
      return InvestmentTransactionType.INTEREST;
    }
    return InvestmentTransactionType.INCOME;
  }

  if (primary === "TRANSFER_IN") {
    if (detailed?.includes("INVESTMENT") || detailed?.includes("RETIREMENT")) {
      return InvestmentTransactionType.CONTRIBUTION;
    }
    return InvestmentTransactionType.TRANSFER;
  }

  if (primary === "TRANSFER_OUT") {
    return InvestmentTransactionType.TRANSFER;
  }

  if (primary === "BANK_FEES") {
    if (detailed?.includes("INTEREST")) {
      return InvestmentTransactionType.INTEREST;
    }
    return InvestmentTransactionType.FEE;
  }

  if (amount < 0) {
    return InvestmentTransactionType.CONTRIBUTION;
  }

  return InvestmentTransactionType.FEE;
};

const mapPlaidToDebitCredit = (amount: number): DebitCreditMemo => {
  // In Plaid, positive amounts are debits (money going out)
  // In FDX, DEBIT means money going out, CREDIT means money coming in
  if (amount < 0) {
    return DebitCreditMemo.CREDIT;
  }
  return DebitCreditMemo.DEBIT;
};

const mapPlaidStatusToFdx = (pending: boolean): TransactionStatus => {
  return pending ? TransactionStatus.PENDING : TransactionStatus.POSTED;
};

const createPlaidFiAttributes = (
  transaction: PlaidTransaction,
): FiAttribute[] => {
  const attributes: FiAttribute[] = [
    {
      name: "plaid_transaction_id",
      value: transaction.transaction_id,
    },
    {
      name: "plaid_account_id",
      value: transaction.account_id,
    },
  ];

  if (transaction.merchant_entity_id) {
    attributes.push({
      name: "merchant_entity_id",
      value: transaction.merchant_entity_id,
    });
  }

  if (transaction.payment_channel) {
    attributes.push({
      name: "payment_channel",
      value: transaction.payment_channel,
    });
  }

  if (transaction.personal_finance_category?.primary) {
    attributes.push({
      name: "plaid_category_primary",
      value: transaction.personal_finance_category.primary,
    });
  }

  if (transaction.personal_finance_category?.detailed) {
    attributes.push({
      name: "plaid_category_detailed",
      value: transaction.personal_finance_category.detailed,
    });
  }

  if (transaction.pending_transaction_id) {
    attributes.push({
      name: "pending_transaction_id",
      value: transaction.pending_transaction_id,
    });
  }

  return attributes;
};

export const mapPlaidTransactionToFdx = ({
  transaction,
  accountId,
  accountType,
}: {
  transaction: PlaidTransaction;
  accountId?: string;
  accountType?: PlaidAccountType;
}): TransactionItem => {
  const type = accountType || "depository";

  const baseTransaction = {
    accountId: accountId || transaction.account_id,
    transactionId: transaction.transaction_id,
    postedTimestamp: transaction.datetime || `${transaction.date}T12:00:00Z`,
    transactionTimestamp:
      transaction.authorized_datetime ||
      transaction.datetime ||
      `${transaction.date}T12:00:00Z`,
    description: transaction.name || "Transaction",
    memo: transaction.merchant_name || undefined,
    debitCreditMemo: mapPlaidToDebitCredit(transaction.amount),
    amount: Math.abs(transaction.amount), // FDX uses positive amounts
    status: mapPlaidStatusToFdx(transaction.pending),
    category: transaction.personal_finance_category?.primary,
    subCategory: transaction.personal_finance_category?.detailed,
    reference: transaction.payment_meta?.reference_number || undefined,
    fiAttributes: createPlaidFiAttributes(transaction),
  };

  switch (type) {
    case "investment":
    case "brokerage": {
      const investmentTransaction: InvestmentTransaction = {
        ...baseTransaction,
        transactionType: mapPlaidToFdxInvestmentType(transaction),
      };
      return { investmentTransaction };
    }

    case "credit": {
      const locTransaction: LocTransaction = {
        ...baseTransaction,
        transactionType: mapPlaidToFdxLocType(transaction),
        checkNumber: transaction.check_number
          ? parseInt(transaction.check_number, 10)
          : undefined,
      };
      return { locTransaction };
    }

    case "loan": {
      const loanTransaction: LoanTransaction = {
        ...baseTransaction,
        transactionType: mapPlaidToFdxLoanType(transaction),
      };
      return { loanTransaction };
    }

    case "depository":
    case "other":
    default: {
      const depositTransaction: DepositTransaction = {
        ...baseTransaction,
        transactionType: mapPlaidToFdxDepositType(transaction),
        checkNumber: transaction.check_number
          ? parseInt(transaction.check_number, 10)
          : undefined,
        payee:
          transaction.payment_meta?.payee ||
          transaction.merchant_name ||
          undefined,
      };
      return { depositTransaction };
    }
  }
};

export const formatDateForPlaid = (date: Date): string => {
  return date.toISOString().split("T")[0];
};
