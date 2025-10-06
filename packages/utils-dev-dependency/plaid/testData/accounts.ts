import type {
  PlaidAccount,
  PlaidAccountsResponse,
} from "@repo/plaid-adapter/src/fdxDataTransforming/accounts";

export const checkingAccount = {
  account_id: "MMNXZ6j8ZXIrxlvGqqa8Fq7E6XeNeBSLWWjvw",
  balances: {
    available: 100,
    current: 110,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  holder_category: "personal" as const,
  mask: "0000",
  name: "Plaid Checking",
  official_name: "Plaid Gold Standard 0% Interest Checking",
  subtype: "checking" as const,
  type: "depository" as const,
} as PlaidAccount;

export const savingsAccount = {
  account_id: "1pM8w54Rw8IonZyWppaxTpNwDV9B9qupkknRn",
  balances: {
    available: 200,
    current: 210,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  holder_category: "personal" as const,
  mask: "1111",
  name: "Plaid Saving",
  official_name: "Plaid Silver Standard 0.1% Interest Saving",
  subtype: "savings" as const,
  type: "depository" as const,
} as PlaidAccount;

export const cdAccount = {
  account_id: "XMJWb68RkaI7Z87BkrngcgLBaem7qZIbmrxDD",
  balances: {
    available: null,
    current: 1000,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "2222",
  name: "Plaid CD",
  official_name: "Plaid Bronze Standard 0.2% Interest CD",
  subtype: "cd" as const,
  type: "depository" as const,
} as PlaidAccount;

export const creditCardAccount = {
  account_id: "DWXDn68GQMubeVbNnjBLueXNrbmqjGI35rXZd",
  balances: {
    available: null,
    current: 410,
    iso_currency_code: "USD",
    limit: 2000,
    unofficial_currency_code: null,
  },
  mask: "3333",
  name: "Plaid Credit Card",
  official_name: "Plaid Diamond 12.5% APR Interest Credit Card",
  subtype: "credit card" as const,
  type: "credit" as const,
} as PlaidAccount;

export const moneyMarketAccount = {
  account_id: "VQJDZ6WmKxiPegPXvbxWTkWBrE6yJlc9BvnDN",
  balances: {
    available: 43200,
    current: 43200,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "4444",
  name: "Plaid Money Market",
  official_name: "Plaid Platinum Standard 1.85% Interest Money Market",
  subtype: "money market" as const,
  type: "depository" as const,
} as PlaidAccount;

export const iraAccount = {
  account_id: "wpZmRwK1rNIy1Zy7BKmatbvjV91RPgfPbalQd",
  balances: {
    available: null,
    current: 320.76,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "5555",
  name: "Plaid IRA",
  official_name: null,
  subtype: "ira" as const,
  type: "investment" as const,
} as PlaidAccount;

export const investment401kAccount = {
  account_id: "5N8mnRoaqrUAnmALQ3gvudbR8MapZGi51Ep6e",
  balances: {
    available: null,
    current: 23631.9805,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "6666",
  name: "Plaid 401k",
  official_name: null,
  subtype: "401k" as const,
  type: "investment" as const,
} as PlaidAccount;

export const studentLoanAccount = {
  account_id: "JzXDw6EWo8IlrmlZWzBoHjkdG6VKXpuBDG5nl",
  balances: {
    available: null,
    current: 65262,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  holder_category: "personal" as const,
  mask: "7777",
  name: "Plaid Student Loan",
  official_name: null,
  subtype: "student" as const,
  type: "loan" as const,
} as PlaidAccount;

export const mortgageAccount = {
  account_id: "kaBWMPyogGUMxdMKR8pNCG7BP1JRmEuLl38my",
  balances: {
    available: null,
    current: 56302.06,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "8888",
  name: "Plaid Mortgage",
  official_name: null,
  subtype: "mortgage" as const,
  type: "loan" as const,
} as PlaidAccount;

export const hsaAccount = {
  account_id: "l43nmjZo8lUDdgDvye7PH5BXRDx9qMSpV5rMP",
  balances: {
    available: 6009,
    current: 6009,
    iso_currency_code: "USD",
    limit: null,
    unofficial_currency_code: null,
  },
  mask: "9001",
  name: "Plaid HSA",
  official_name: "Plaid Cares Health Savings Account",
  subtype: "hsa" as const,
  type: "depository" as const,
} as PlaidAccount;

export const authResponse: PlaidAccountsResponse = {
  accounts: [
    checkingAccount,
    savingsAccount,
    {
      account_id: "LZNXb64kbXhKvQWjlld7sNLxD6WPWVfkxxAMV",
      balances: {
        available: 12060,
        current: 12060,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      mask: "9002",
      name: "Plaid Cash Management",
      official_name: "Plaid Growth Cash Management",
      subtype: "cash management",
      type: "depository",
    },
  ],
  item: {
    auth_method: "INSTANT_AUTH",
    available_products: [
      "assets",
      "balance",
      "credit_details",
      "identity",
      "identity_match",
      "income",
      "income_verification",
      "investments",
      "liabilities",
      "signal",
    ],
    billed_products: ["auth", "transactions"],
    consent_expiration_time: null,
    consented_products: [
      "assets",
      "auth",
      "identity",
      "identity_match",
      "income_verification",
      "transactions",
    ],
    error: null,
    institution_id: "ins_109512",
    institution_name: "Houndstooth Bank",
    item_id: "vLQngyqJK4IKeyKjw9kdtMjKAAjWxeIWnlevz",
    products: ["auth", "transactions"],
    update_type: "background",
    webhook:
      "https://dummy.com/webhook/plaid_sandbox/?connection_id=575e100a-9f68-407e-be1b-6eb52bf2b843",
  },
  numbers: {
    ach: [
      {
        account: "1111222233330000",
        account_id: checkingAccount.account_id,
        is_tokenized_account_number: false,
        routing: "011401533",
        wire_routing: "021000021",
      },
      {
        account: "1111222233331111",
        account_id: savingsAccount.account_id,
        is_tokenized_account_number: false,
        routing: "011401533",
        wire_routing: "021000021",
      },
      {
        account: "1111222233339002",
        account_id: "LZNXb64kbXhKvQWjlld7sNLxD6WPWVfkxxAMV",
        is_tokenized_account_number: false,
        routing: "011401533",
        wire_routing: "021000021",
      },
    ],
    bacs: [],
    eft: [],
    international: [],
  },
  request_id: "Z9Obt8Gzamp2pjh",
};

export const accountsResponse: PlaidAccountsResponse = {
  accounts: [
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
    {
      account_id: "LZNXb64kbXhKvQWjlld7sNLxD6WPWVfkxxAMV",
      balances: {
        available: 12060,
        current: 12060,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      mask: "9002",
      name: "Plaid Cash Management",
      official_name: "Plaid Growth Cash Management",
      subtype: "cash management",
      type: "depository",
    },
    {
      account_id: "KBXDA6nWgESqz6qMmlWDi8GKjePJoktRxjmJz",
      balances: {
        available: 4980,
        current: 5020,
        iso_currency_code: "USD",
        limit: 10000,
        unofficial_currency_code: null,
      },
      holder_category: "business",
      mask: "9999",
      name: "Plaid Business Credit Card",
      official_name: "Plaid Platinum Small Business Credit Card",
      subtype: "credit card",
      type: "credit",
    },
  ],
  item: {
    available_products: [
      "assets",
      "balance",
      "credit_details",
      "identity",
      "identity_match",
      "income",
      "income_verification",
      "investments",
      "liabilities",
      "signal",
    ],
    billed_products: ["transactions"],
    consent_expiration_time: null,
    consented_products: [
      "assets",
      "identity",
      "identity_match",
      "income_verification",
      "transactions",
    ],
    error: null,
    institution_id: "ins_109512",
    institution_name: "Houndstooth Bank",
    item_id: "vLQngyqJK4IKeyKjw9kdtMjKAAjWxeIWnlevz",
    products: ["transactions"],
    update_type: "background",
    webhook:
      "https://dummy.com/webhook/plaid_sandbox/?connection_id=324226df-85c3-4f5c-a528-dc04dc2c801b",
  },
  request_id: "aQGZLO0mJl4pwuc",
};
