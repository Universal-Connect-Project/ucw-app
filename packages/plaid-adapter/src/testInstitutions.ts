import type { CachedInstitution } from "@repo/utils";

export const testInstitutions: CachedInstitution[] = [
  {
    name: "Houndstooth Bank",
    id: "plaidbank",
    keywords: ["plaid"],
    logo: "https://plaid.com/",
    url: "https://plaid.com/",
    is_test_bank: true,
    routing_numbers: [],
    plaid: {
      id: "ins_109512",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
];
