import type { CachedInstitution } from "@repo/utils";

export const testInstitutions: CachedInstitution[] = [
  {
    name: "FlinksCapital",
    id: "FlinksCapital",
    keywords: ["FlinksCapital", "flinks"],
    logo: "https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/102105/icon.svg",
    url: "http://www.flinks.com",
    is_test_bank: true,
    routing_numbers: [],
    flinks: {
      id: "14",
      supports_aggregation: true,
      supports_history: false,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
      supportsRewards: true,
      supportsBalance: true,
    },
  }
];
