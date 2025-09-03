import type { CachedInstitution } from "@repo/utils";

export const MX_BANK_OAUTH_NAME = "MX Bank (Oauth)";
export const MX_BANK_OAUTH_UCP_INSTITUTION_ID = "mxBankOauth";
export const MX_BANK_UCP_INSTITUTION_ID = "mxBank";
export const MX_BANK_MX_INSTITUTION_ID = "mxbank";
export const MX_BANK_TO_HIDE_NAME = "MX Bank to hide";
export const MX_BANK_NAME = "MX Bank";
export const MX_BANK_TRANSACTIONS_ONLY_NAME = "MX Bank transactions only";
export const MX_BANK_ROUTING_NUMBER = "111111111";

export const testInstitutions: CachedInstitution[] = [
  {
    name: MX_BANK_TRANSACTIONS_ONLY_NAME,
    id: "mxBankTransactionsOnly",
    keywords: ["Gringotts", "MX Bank"],
    logo: "https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    url: "https://mx.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: MX_BANK_MX_INSTITUTION_ID,
      supports_aggregation: true,
      supports_history: false,
      supports_identification: false,
      supports_oauth: false,
      supports_verification: false,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
  {
    name: MX_BANK_TO_HIDE_NAME,
    id: "mxBankToHide",
    keywords: ["Gringotts", "MX Bank"],
    logo: "https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    url: "https://mx.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "mxbank",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: false,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
  {
    name: MX_BANK_NAME,
    id: MX_BANK_UCP_INSTITUTION_ID,
    keywords: ["Gringotts", "MX Bank"],
    logo: "https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    url: "https://mx.com",
    is_test_bank: true,
    routing_numbers: [MX_BANK_ROUTING_NUMBER],
    mx: {
      id: "mxbank",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: false,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
  {
    name: MX_BANK_OAUTH_NAME,
    id: MX_BANK_OAUTH_UCP_INSTITUTION_ID,
    keywords: ["Gringotts", "MX Bank", "oauth"],
    logo: "https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    url: "https://mx.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "mx_bank_oauth",
      supports_aggregation: true,
      supports_history: false,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
  {
    name: "MXCU (OAuth)",
    id: "mxCUOauth",
    keywords: ["oauth"],
    logo: null,
    url: "https://mxcu.mx.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "mxcu_oauth",
      supports_aggregation: true,
      supports_history: false,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
  {
    name: "MXCU (Credential)",
    id: "mxCuCredential",
    keywords: [],
    logo: null,
    url: "https://mxcu.mx.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "mxcu_credential",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: false,
      supports_verification: true,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
];
