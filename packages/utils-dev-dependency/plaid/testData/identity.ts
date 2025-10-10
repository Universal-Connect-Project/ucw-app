interface AccountBalance {
  available: number | null;
  current: number;
  iso_currency_code: string;
  limit: number | null;
  unofficial_currency_code: string | null;
}

interface IdentityResponse {
  accounts: Array<{
    account_id: string;
    balances: AccountBalance;
    [key: string]: any;
  }>;
  item: any;
  request_id: string;
}

export const identityResponse: IdentityResponse = {
  accounts: [
    {
      account_id: "dzQ9jL84GxSXq1v8ZmxZInARwNrgzPCJeo5GZ",
      balances: {
        available: 100,
        current: 110,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      holder_category: "personal",
      mask: "0000",
      name: "Plaid Checking",
      official_name: "Plaid Gold Standard 0% Interest Checking",
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "checking",
      type: "depository",
    },
    {
      account_id: "aqjG4Z9xoztrj15e6Bz6InGqJQlNRWCZLplPZ",
      balances: {
        available: 200,
        current: 210,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      holder_category: "personal",
      mask: "1111",
      name: "Plaid Saving",
      official_name: "Plaid Silver Standard 0.1% Interest Saving",
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "savings",
      type: "depository",
    },
    {
      account_id: "4WldBRGqM9t3q48xDBNDF1rlW6kMVzhJ78Nkl",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "cd",
      type: "depository",
    },
    {
      account_id: "NZWymEgkAoS1mXoKyvPyuKNJ5boyV4symLBxn",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "credit card",
      type: "credit",
    },
    {
      account_id: "P1GA9lonm8HK8znJWBMWfqmD54bNLPioZEBJN",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "money market",
      type: "depository",
    },
    {
      account_id: "j4o61WPQwjTaJLb5wjDwiBg4mvnwJWi6qozww",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "ira",
      type: "investment",
    },
    {
      account_id: "7nrNdKlz86ILWV8ZDa7DUobZ8dz73xFdL4Aj6",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "401k",
      type: "investment",
    },
    {
      account_id: "eBZD7p1NbdSRKzoyZxdZhEnRqxvKVXUr1yREx",
      balances: {
        available: null,
        current: 65262,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      holder_category: "personal",
      mask: "7777",
      name: "Plaid Student Loan",
      official_name: null,
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "student",
      type: "loan",
    },
    {
      account_id: "QLnAvqmb9Eh4yondR1ARiKApDXBP6jswEr4zB",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "mortgage",
      type: "loan",
    },
    {
      account_id: "Zn3Ar4eldvIDMmn165A6INkepmVKwgFeVnAz9",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "hsa",
      type: "depository",
    },
    {
      account_id: "MQkVb8oWEptvxqp6QyNQi6ZX8M9qQaCLVbwzZ",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "cash management",
      type: "depository",
    },
    {
      account_id: "1gnBKRmXPbSynpQdEKXEcD7Vgz5pRrCplbL3L",
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
      owners: [
        {
          addresses: [
            {
              data: {
                city: "Malakoff",
                country: "US",
                postal_code: "14236",
                region: "NY",
                street: "2992 Cameron Road",
              },
              primary: true,
            },
            {
              data: {
                city: "San Matias",
                country: "US",
                postal_code: "93405-2255",
                region: "CA",
                street: "2493 Leisure Lane",
              },
              primary: false,
            },
          ],
          emails: [
            {
              data: "accountholder0@example.com",
              primary: true,
              type: "primary",
            },
            {
              data: "accountholder1@example.com",
              primary: false,
              type: "secondary",
            },
            {
              data: "extraordinarily.long.email.username.123456@reallylonghostname.com",
              primary: false,
              type: "other",
            },
          ],
          names: ["Alberta Bobbeth Charleson"],
          phone_numbers: [
            {
              data: "1112223333",
              primary: false,
              type: "home",
            },
            {
              data: "1112224444",
              primary: false,
              type: "work",
            },
            {
              data: "1112225555",
              primary: false,
              type: "mobile",
            },
          ],
        },
      ],
      subtype: "credit card",
      type: "credit",
    },
  ],
  item: {
    available_products: [
      "assets",
      "balance",
      "credit_details",
      "identity_match",
      "income",
      "income_verification",
      "investments",
      "liabilities",
      "signal",
    ],
    billed_products: ["identity", "transactions"],
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
    item_id: "aqjG4Z9xoztrj15e6Bz6InG8BPqqobF7XedKB",
    products: ["identity", "transactions"],
    update_type: "background",
    webhook:
      "https://7e6e7efa5655.ngrok-free.app/webhook/plaid_sandbox/?connection_id=47c82d69-24b1-480b-bd36-3ef6b2a62ce4",
  },
  request_id: "qNPoAAmOMbJJ1i9",
};
