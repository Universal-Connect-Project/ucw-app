import type { CachedInstitution } from "@repo/utils";

export const testInstitutions: CachedInstitution[] = [
  {
    name: "Mikomo Bank",
    id: "mikomoBank",
    keywords: ["akoya", "mikomo"],
    logo: "https://cdn.brandfetch.io/idwKHUTdZK/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668071436139",
    url: "https://docs.akoya.com/docs/introduction-to-mikomo-and-the-sandbox",
    is_test_bank: true,
    routing_numbers: [],
    akoya: {
      id: "mikomo",
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
