import type { CachedInstitution } from "@repo/utils";

export const finicityInsitutionData = {
  institution: {
    id: "testId",
    name: "FinBank",
    voa: true,
    voi: true,
    stateAgg: true,
    ach: true,
    transAgg: true,
    aha: false,
    availBalance: false,
    accountOwner: true,
    loanPaymentDetails: false,
    studentLoanData: false,
    accountTypeDescription: "Fake",
    phone: "",
    urlHomeApp: "https://finbank.prod.fini.city/CCBankImageMFA/login.jsp",
    urlLogonApp: "https://finbank.prod.fini.city/CCBankImageMFA/login.jsp",
    oauthEnabled: false,
    urlForgotPassword: "https://developer.mastercard.com/forgot-password",
    urlOnlineRegistration: "https://www.finicity.com/signup/",
    class: "testfi",
    specialText:
      "Please enter your FinBank Username and Password required for login.",
    address: {
      city: "Utah",
      state: "",
      country: "USA",
      postalCode: "",
      addressLine1: "",
      addressLine2: "",
    },
    currency: "USD",
    email: "finbank.ds5@finicity.com",
    status: "online",
    branding: {
      logo: "https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/logo.svg",
      alternateLogo:
        "https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/alternateLogo.svg",
      icon: "https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/icon.svg",
      primaryColor: "#1B3E4A",
      tile: "https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/tile.svg",
    },
    productionStatus: {
      overallStatus: "online",
      transAgg: "online",
      voa: "online",
      voi: "online",
      stateAgg: "online",
      ach: "online",
      aha: "online",
    },
  },
};

export const elasticSearchInstitutionData: CachedInstitution = {
  name: "MX Bank (Oauth)",
  keywords: ["Gringotts", "MX Bank", "oauth"],
  logo: "https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
  url: "https://mx.com",
  id: "048b9a67-53ac-453c-9bff-baf418282311",
  is_test_bank: true,
  routing_numbers: ["1234567"],
  mx: {
    id: "INS-68e96dd6-eabd-42d3-9f05-416897f0746c",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: false,
  },
};

export const elasticSearchInstitutionDataFavs: CachedInstitution[] = [
  {
    name: "Non test bank",
    id: "cd27ed3b-f81c-4fa9-94a9-039a9f534c7b",
    keywords: ["test", "example"],
    logo: "https://universalconnectproject.org/images/ucp-logo-icon.svg",
    url: "https://test-example.com",
    is_test_bank: false,
    routing_numbers: [],
    mx: {
      id: "testExampleB",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
    },
  },
  {
    name: "Test bank",
    id: "5e498f60-3496-4299-96ed-f8eb328ae8af",
    keywords: ["test", "example", "tex"],
    logo: "https://universalconnectproject.org/images/ucp-logo-icon.svg",
    url: "https://test-example.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "testExampleA",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: true,
      supports_oauth: true,
      supports_verification: true,
    },
  },
  {
    name: "Test Doesnt Support Identification Bank",
    id: "4c1b2595-a5aa-41a1-a2c6-f6caa1e226a6",
    keywords: ["test", "example"],
    logo: "https://universalconnectproject.org/images/ucp-logo-icon.svg",
    url: "https://test-example.com",
    is_test_bank: true,
    routing_numbers: [],
    mx: {
      id: "testExampleB",
      supports_aggregation: true,
      supports_history: true,
      supports_identification: false,
      supports_oauth: true,
      supports_verification: true,
    },
  },
];

export const transformedInstitutionList = [
  {
    guid: "048b9a67-53ac-453c-9bff-baf418282311",
    name: "MX Bank (Oauth)",
    url: "https://mx.com",
    logo_url:
      "https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    supports_oauth: true,
  },
  {
    guid: "048b9a67-53ac-453c-9bff-baf418282311",
    name: "MX Bank (Oauth)",
    url: "https://mx.com",
    logo_url:
      "https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    supports_oauth: true,
  },
];

export const transformedPopularInstitutionsList = [
  {
    guid: "048b9a67-53ac-453c-9bff-baf418282311",
    name: "MX Bank (Oauth)",
    url: "https://mx.com",
    logo_url:
      "https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png",
    supports_oauth: true,
  },
];
