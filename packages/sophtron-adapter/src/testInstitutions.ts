import type { CachedInstitution } from "@repo/utils";

export const SOPHTRON_BANK_NAME = "Sophtron Bank";
export const SOPHTRON_BANK_NO_MFA_SOPHTRON_INSTITUTION_ID =
  "926623ca-5952-4921-8f77-2023f1cdde8e";

export const testInstitutions: CachedInstitution[] = [
  {
    name: SOPHTRON_BANK_NAME,
    id: "sophtronBank",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "8d0d9991-5e35-4b82-afa4-e93695e5ca7d",
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
    name: "Sophtron Bank Captcha",
    id: "sophtronBankCaptcha",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "8ad00f00-72b7-4642-a0de-b3f31e08510a",
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
    name: "Sophtron Bank Token",
    id: "sophtronBankToken",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "337fe0c2-476e-46f5-a360-bf33f9fe1937",
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
    name: "Sophtron Bank NoMFA",
    id: "sophtronBankNoMFA",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: SOPHTRON_BANK_NO_MFA_SOPHTRON_INSTITUTION_ID,
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
    name: "Sophtron Bank SecurityQuestion",
    id: "sophtronBankSecurityQuestion",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "8809dee7-9e23-4039-a723-02bc01fce0f2",
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
    name: "Sophtron Bank SecurityQuestion Multiple",
    id: "sophtronBankSecurityQuestionMultiple",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "8f32ccc1-acaf-4e6b-93b8-1f2cd398647d",
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
    name: "Sophtron Bank TokenRead",
    id: "sophtronBankTokenRead",
    keywords: ["soph"],
    logo: "https://sophtron.com/_nuxt/img/Logo_Blue_1.f0ad5ae.png",
    url: "https://sophtron.com",
    is_test_bank: true,
    routing_numbers: [],
    sophtron: {
      id: "0fe7236b-079a-4fe6-aed9-cf194790a553",
      supports_aggregation: true,
      supports_history: false,
      supports_identification: false,
      supports_oauth: false,
      supports_verification: false,
      supportsRewards: false,
      supportsBalance: false,
    },
  },
];
