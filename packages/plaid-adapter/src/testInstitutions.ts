import type { CachedInstitution } from "@repo/utils";

export const testInstitutions: CachedInstitution[] = [
  {
    name: "Plaid Bank",
    id: "plaidbank",
    keywords: ["plaid"],
    logo: "https://cdn.brandfetch.io/idly0-MZ4j/w/399/h/399/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668516050085",
    url: "https://plaid.com/",
    is_test_bank: true,
    routing_numbers: [],
    plaid: {
      id: "ins_plaid_bank",
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
