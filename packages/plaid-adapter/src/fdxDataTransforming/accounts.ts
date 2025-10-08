import {
  AccountCategory,
  AccountSubType,
  FdxAccountBase,
  FdxAccountsResponse,
  FdxDepositAccount,
  FdxFiAttribute,
  FdxLoanAccount,
  FdxLocAccount,
  FdxInvestmentAccount,
  FdxInsuranceAccount,
  FdxAnnuityAccount,
  AccountStatus,
  BalanceType,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";

// Plaid response types
export interface PlaidAccount {
  account_id: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string;
    limit: number | null;
    unofficial_currency_code: string | null;
  };
  holder_category?: "personal" | "business";
  mask: string;
  name: string;
  official_name: string | null;
  subtype:
    | "401a"
    | "401k"
    | "403B"
    | "457b"
    | "529"
    | "auto"
    | "brokerage"
    | "business"
    | "cash isa"
    | "cash management"
    | "cd"
    | "checking"
    | "commercial"
    | "construction"
    | "consumer"
    | "credit card"
    | "crypto exchange"
    | "ebt"
    | "education savings account"
    | "fixed annuity"
    | "gic"
    | "health reimbursement arrangement"
    | "home equity"
    | "hsa"
    | "isa"
    | "ira"
    | "keogh"
    | "lif"
    | "life insurance"
    | "line of credit"
    | "lira"
    | "loan"
    | "lrif"
    | "lrsp"
    | "money market"
    | "mortgage"
    | "mutual fund"
    | "non-custodial wallet"
    | "non-taxable brokerage account"
    | "other"
    | "other insurance"
    | "other annuity"
    | "overdraft"
    | "paypal"
    | "payroll"
    | "pension"
    | "prepaid"
    | "prif"
    | "profit sharing plan"
    | "rdsp"
    | "resp"
    | "retirement"
    | "rlif"
    | "roth"
    | "roth 401k"
    | "rrif"
    | "rrsp"
    | "sarsep"
    | "savings"
    | "sep ira"
    | "simple ira"
    | "sipp"
    | "stock plan"
    | "student"
    | "thrift savings plan"
    | "tfsa"
    | "trust"
    | "ugma"
    | "utma"
    | "variable annuity";
  type: "depository" | "credit" | "loan" | "investment" | "payroll" | "other";
}

interface PlaidAccountNumbers {
  ach?: Array<{
    account: string;
    account_id: string;
    is_tokenized_account_number: boolean;
    routing: string;
    wire_routing?: string;
  }>;
  bacs?: Array<{
    account: string;
    account_id: string;
    sort_code: string;
  }>;
  eft?: Array<{
    account: string;
    account_id: string;
    branch: string;
    institution: string;
  }>;
  international?: Array<{
    account_id: string;
    bic: string;
    iban: string;
  }>;
}

interface PlaidError {
  error_type?: string;
  error_code?: string;
  error_message?: string;
  display_message?: string | null;
  request_id?: string;
}

export interface PlaidAccountsResponse {
  accounts: PlaidAccount[];
  item: {
    auth_method?: string;
    available_products?: string[];
    billed_products?: string[];
    consent_expiration_time?: string | null;
    consented_products?: string[];
    error?: PlaidError;
    institution_id: string;
    institution_name: string;
    item_id: string;
    products?: string[];
    update_type?: string;
    webhook?: string;
  };
  numbers?: PlaidAccountNumbers;
  request_id: string;
}

const mapPlaidSubtypeToFdxAccountType = (
  plaidSubtype: PlaidAccount["subtype"],
): AccountSubType => {
  const subtypeMap: Record<PlaidAccount["subtype"], AccountSubType> = {
    // Depository account mappings
    checking: AccountSubType.CHECKING,
    savings: AccountSubType.SAVINGS,
    "money market": AccountSubType.MONEYMARKET,
    cd: AccountSubType.CD,
    payroll: AccountSubType.CHECKING,
    "cash management": AccountSubType.CHECKING,
    ebt: AccountSubType.CHECKING,
    business: AccountSubType.COMMERCIALDEPOSIT,
    commercial: AccountSubType.COMMERCIALDEPOSIT,

    // Credit account mappings
    "credit card": AccountSubType.CREDITCARD,
    "line of credit": AccountSubType.LINEOFCREDIT,
    overdraft: AccountSubType.LINEOFCREDIT,

    // Loan account mappings
    auto: AccountSubType.AUTOLOAN,
    mortgage: AccountSubType.MORTGAGE,
    "home equity": AccountSubType.HOMEEQUITYLOAN,
    student: AccountSubType.STUDENTLOAN,
    loan: AccountSubType.LOAN,
    construction: AccountSubType.LOAN,
    consumer: AccountSubType.PERSONALLOAN,

    // Investment account mappings
    "401k": AccountSubType._401K,
    "401a": AccountSubType._401A,
    "403B": AccountSubType._403B,
    "457b": AccountSubType._401K,
    "529": AccountSubType._529,
    brokerage: AccountSubType.BROKERAGEPRODUCT,
    ira: AccountSubType.IRA,
    roth: AccountSubType.ROTH,
    "roth 401k": AccountSubType.ROTH,
    "sep ira": AccountSubType.IRA,
    "simple ira": AccountSubType.IRA,
    sarsep: AccountSubType.SARSEP,
    keogh: AccountSubType.KEOGH,
    pension: AccountSubType.DEFINEDBENEFIT,
    "profit sharing plan": AccountSubType.DEFERREDPROFITSHARINGPLAN,
    "thrift savings plan": AccountSubType._401K,
    "mutual fund": AccountSubType.INVESTMENTACCOUNT,
    "non-taxable brokerage account": AccountSubType.BROKERAGEPRODUCT,
    "education savings account": AccountSubType.COVERDELL,
    hsa: AccountSubType.SAVINGS,
    retirement: AccountSubType.IRA,
    "stock plan": AccountSubType.INVESTMENTACCOUNT,
    trust: AccountSubType.TRUST,
    ugma: AccountSubType.UGMA,
    utma: AccountSubType.UTMA,

    // Canadian retirement accounts
    rrsp: AccountSubType.REGISTEREDRETIREMENTSAVINGSPLAN,
    rrif: AccountSubType.REGISTEREDRETIREMENTINCOMEFUND,
    tfsa: AccountSubType.TAXFREESAVINGSACCOUNT,
    resp: AccountSubType.REGISTEREDEDUCATIONSAVINGSPLAN,
    rdsp: AccountSubType.REGISTEREDDISABILITYSAVINGSPLAN,
    lira: AccountSubType.LOCKEDINRETIREMENTACCOUNT,
    lrsp: AccountSubType.LOCKEDINRETIREMENTSAVINGSPLAN,
    lif: AccountSubType.LIFEINCOMEFUND,
    lrif: AccountSubType.LOCKEDINRETIREMENTINCOMEFUND,
    rlif: AccountSubType.RESTRICTEDLIFEINCOMEFUND,
    prif: AccountSubType.PRESCRIBEDREGISTEREDRETIREMENTINCOMEFUND,

    // Insurance and annuity accounts
    "life insurance": AccountSubType.WHOLELIFE,
    "fixed annuity": AccountSubType.FIXEDANNUITY,
    "variable annuity": AccountSubType.VARIABLEANNUITY,
    "other annuity": AccountSubType.ANNUITY,
    "other insurance": AccountSubType.WHOLELIFE,

    // Investment specific
    "cash isa": AccountSubType.SAVINGS,
    isa: AccountSubType.INVESTMENTACCOUNT,
    sipp: AccountSubType.INVESTMENTACCOUNT,
    gic: AccountSubType.CD, // Guaranteed Investment Certificate similar to CD
    "crypto exchange": AccountSubType.DIGITALASSET,
    "non-custodial wallet": AccountSubType.DIGITALASSET,

    // Other/misc
    prepaid: AccountSubType.CHECKING,
    paypal: AccountSubType.CHECKING,
    "health reimbursement arrangement": AccountSubType.SAVINGS,
    other: AccountSubType.OTHERDEPOSIT,
  };

  return subtypeMap[plaidSubtype] || AccountSubType.OTHERDEPOSIT;
};

const mapPlaidAccountTypeToFdx = ({
  plaidType,
  plaidSubtype,
}: {
  plaidType: PlaidAccount["type"];
  plaidSubtype: PlaidAccount["subtype"];
}): {
  accountCategory: AccountCategory;
  accountType: AccountSubType;
} => {
  const accountType = mapPlaidSubtypeToFdxAccountType(plaidSubtype);

  switch (plaidType.toLowerCase()) {
    case "depository":
      return {
        accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
        accountType,
      };
    case "credit":
      return {
        accountCategory: AccountCategory.LOC_ACCOUNT,
        accountType,
      };
    case "loan":
      return {
        accountCategory: AccountCategory.LOAN_ACCOUNT,
        accountType,
      };
    case "investment":
      return {
        accountCategory: AccountCategory.INVESTMENT_ACCOUNT,
        accountType,
      };
    case "payroll":
      return {
        accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
        accountType,
      };
    default:
      return {
        accountCategory: AccountCategory.DEPOSIT_ACCOUNT,
        accountType,
      };
  }
};

const getBalanceType = (plaidType: PlaidAccount["type"]): BalanceType => {
  switch (plaidType.toLowerCase()) {
    case "depository":
    case "investment":
    case "payroll":
      return BalanceType.ASSET;
    case "credit":
    case "loan":
      return BalanceType.LIABILITY;
    default:
      return BalanceType.ASSET;
  }
};

const createFiAttributes = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
}): FdxFiAttribute[] => {
  return [
    {
      name: "plaidAccountId",
      value: plaidAccount.account_id,
    },
    {
      name: "plaidItemId",
      value: itemId,
    },
    {
      name: "plaidInstitutionId",
      value: institutionId,
    },
    {
      name: "plaidInstitutionName",
      value: institutionName,
    },
  ];
};

const getAccountNumber = (
  plaidAccount: PlaidAccount,
  numbers?: PlaidAccountNumbers,
): { accountNumber?: string; routingTransitNumber?: string } => {
  if (!numbers?.ach) {
    return {};
  }

  const achDetails = numbers.ach.find(
    (ach) => ach.account_id === plaidAccount.account_id,
  );

  if (achDetails) {
    return {
      accountNumber: achDetails.account,
      routingTransitNumber: achDetails.routing,
    };
  }

  return {};
};

const transformPlaidAccountToFdx = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxAccountBase => {
  const { accountCategory, accountType } = mapPlaidAccountTypeToFdx({
    plaidType: plaidAccount.type,
    plaidSubtype: plaidAccount.subtype,
  });

  const { accountNumber, routingTransitNumber } = getAccountNumber(
    plaidAccount,
    numbers,
  );

  const baseAccount: FdxAccountBase = {
    accountId: plaidAccount.account_id,
    accountCategory,
    accountType,
    accountNumber,
    accountNumberDisplay: `****${plaidAccount.mask}`,
    productName: plaidAccount.official_name,
    routingTransitNumber,
    nickname: plaidAccount.name,
    status: AccountStatus.OPEN, // Plaid doesn't return closed accounts
    currency: {
      currencyCode: plaidAccount.balances.iso_currency_code,
    },
    fiAttributes: createFiAttributes({
      plaidAccount,
      itemId,
      institutionId,
      institutionName,
    }),
    balanceType: getBalanceType(plaidAccount.type),
  };

  return baseAccount;
};

const transformPlaidDepositAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxDepositAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const depositAccount: FdxDepositAccount = {
    ...baseAccount,
    balanceAsOf: new Date().toISOString(),
    currentBalance: plaidAccount.balances.current || 0,
    availableBalance: plaidAccount.balances.available || 0,
  };

  return depositAccount;
};

const transformPlaidLoanAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxLoanAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const loanAccount: FdxLoanAccount = {
    ...baseAccount,
    balanceAsOf: new Date().toISOString(),
    principalBalance: Math.abs(plaidAccount.balances.current || 0),
    // Note: Plaid doesn't provide detailed loan information in basic accounts endpoint
    // Additional loan details would need to come from liabilities endpoint
  };

  return loanAccount;
};

const transformPlaidLocAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxLocAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const locAccount: FdxLocAccount = {
    ...baseAccount,
    balanceAsOf: new Date().toISOString(),
    currentBalance: Math.abs(plaidAccount.balances.current || 0), // Credit balances are negative in Plaid
    creditLine: plaidAccount.balances.limit || undefined,
    availableCredit: plaidAccount.balances.available || undefined,
  };

  return locAccount;
};

const transformPlaidInvestmentAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxInvestmentAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const investmentAccount: FdxInvestmentAccount = {
    ...baseAccount,
    balanceAsOf: new Date().toISOString(),
    currentValue: plaidAccount.balances.current || 0,
    // Note: Plaid's basic accounts endpoint doesn't provide detailed investment information
    // Holdings, positions, etc. would need to come from investments endpoints
  };

  return investmentAccount;
};

const transformPlaidInsuranceAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxInsuranceAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const insuranceAccount: FdxInsuranceAccount = {
    ...baseAccount,
    // Note: Plaid doesn't typically provide insurance account details in basic accounts endpoint
    // This would likely need specialized insurance data endpoints
  };

  return insuranceAccount;
};

const transformPlaidAnnuityAccount = ({
  plaidAccount,
  itemId,
  institutionId,
  institutionName,
  numbers,
}: {
  plaidAccount: PlaidAccount;
  itemId: string;
  institutionId: string;
  institutionName: string;
  numbers?: PlaidAccountNumbers;
}): FdxAnnuityAccount => {
  const baseAccount = transformPlaidAccountToFdx({
    plaidAccount,
    itemId,
    institutionId,
    institutionName,
    numbers,
  });

  const annuityAccount: FdxAnnuityAccount = {
    ...baseAccount,
    balanceAsOf: new Date().toISOString(),
    currentBalance: plaidAccount.balances.current || 0,
    // Note: Plaid doesn't typically provide annuity-specific details in basic accounts endpoint
  };

  return annuityAccount;
};

export const transformPlaidAccountsToFdx = (
  plaidResponse: PlaidAccountsResponse,
): FdxAccountsResponse => {
  const fdxAccounts = plaidResponse.accounts.map((plaidAccount) => {
    const { accountCategory } = mapPlaidAccountTypeToFdx({
      plaidType: plaidAccount.type,
      plaidSubtype: plaidAccount.subtype,
    });

    const commonParams = {
      plaidAccount,
      itemId: plaidResponse.item.item_id,
      institutionId: plaidResponse.item.institution_id,
      institutionName: plaidResponse.item.institution_name,
      numbers: plaidResponse.numbers,
    };

    switch (accountCategory) {
      case "DEPOSIT_ACCOUNT":
        return {
          depositAccount: transformPlaidDepositAccount(commonParams),
        };

      case "LOC_ACCOUNT":
        return {
          locAccount: transformPlaidLocAccount(commonParams),
        };

      case "LOAN_ACCOUNT":
        return {
          loanAccount: transformPlaidLoanAccount(commonParams),
        };

      case "INVESTMENT_ACCOUNT":
        return {
          investmentAccount: transformPlaidInvestmentAccount(commonParams),
        };

      case "INSURANCE_ACCOUNT":
        return {
          insuranceAccount: transformPlaidInsuranceAccount(commonParams),
        };

      case "ANNUITY_ACCOUNT":
        return {
          annuityAccount: transformPlaidAnnuityAccount(commonParams),
        };

      default:
        return {
          depositAccount: transformPlaidDepositAccount(commonParams),
        };
    }
  });

  return {
    accounts: fdxAccounts,
  };
};
