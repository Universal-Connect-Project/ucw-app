export const plaidTestItemResponse = {
  item: {
    created_at: "2019-01-22T04:32:00Z",
    available_products: ["balance", "auth"],
    billed_products: ["identity", "transactions"],
    products: ["identity", "transactions"],
    error: null as null,
    institution_id: "ins_109508",
    institution_name: "First Platypus Bank",
    item_id: "item-sample-id",
    update_type: "background",
    webhook: "https://plaid.com/example/hook",
    auth_method: null as null,
    consented_products: ["identity", "transactions"],
    consented_data_scopes: [
      "account_and_balance_info",
      "contact_info",
      "transactions",
    ],
    consented_use_cases: [
      "Verify your account",
      "Track and manage your finances",
    ],
    consent_expiration_time: "2024-03-16T15:53:00Z",
  },
  status: {
    transactions: {
      last_successful_update: "2019-02-15T15:52:39Z",
      last_failed_update: "2019-01-22T04:32:00Z",
    },
    last_webhook: {
      sent_at: "2019-02-15T15:53:00Z",
      code_sent: "DEFAULT_UPDATE",
    },
  },
  request_id: "m8MDnv9okwxFNBV",
};
