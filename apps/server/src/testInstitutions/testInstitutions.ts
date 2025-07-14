import type { CachedInstitution } from "@repo/utils";
import {
  MX_BANK_MX_INSTITUTION_ID,
  testInstitutions as mxTestInstitutions,
} from "@repo/mx-adapter";
import { testInstitutions as finicityTestInstitutions } from "@repo/finicity-adapter";
import {
  SOPHTRON_BANK_NO_MFA_SOPHTRON_INSTITUTION_ID,
  testInstitutions as sophtronTestInstitutions,
} from "@repo/sophtron-adapter";
import { testInstitutions as akoyaTestInstitutions } from "@repo/akoya-adapter";

export const CHASE_BANK_TEST_FILTER_NAME = "Chase Bank Test Filter";

export const testChaseBankToFilter: CachedInstitution = {
  name: CHASE_BANK_TEST_FILTER_NAME,
  id: "prodTestBankFilter",
  keywords: ["test"],
  logo: "https://universalconnectproject.org/images/ucp-logo-icon.svg",
  url: "",
  is_test_bank: true,
  routing_numbers: [],
  mx: {
    id: "test",
    supports_aggregation: true,
    supports_history: true,
    supports_identification: true,
    supports_oauth: true,
    supports_verification: true,
    supportsRewards: false,
    supportsBalance: false,
  },
};

const mxAndSophtronTestInstitution: CachedInstitution = {
  name: "MX and Sophtron Test Institution",
  id: "mxAndSophtronTestInstitution",
  keywords: ["test"],
  logo: "https://universalconnectproject.org/images/ucp-logo-icon.svg",
  url: "",
  is_test_bank: true,
  routing_numbers: [],
  mx: {
    id: MX_BANK_MX_INSTITUTION_ID,
    supports_aggregation: true,
    supports_history: true,
    supports_identification: true,
    supports_oauth: true,
    supports_verification: true,
    supportsRewards: false,
    supportsBalance: false,
  },
  sophtron: {
    id: SOPHTRON_BANK_NO_MFA_SOPHTRON_INSTITUTION_ID,
    supports_aggregation: true,
    supports_history: true,
    supports_identification: true,
    supports_oauth: true,
    supports_verification: true,
    supportsRewards: false,
    supportsBalance: false,
  },
};

const buildTestInstitutions = (testInstitutions: CachedInstitution[][]) =>
  testInstitutions.reduce(
    (acc, institutions) => [
      ...acc,
      ...institutions.map((institution) => ({
        ...institution,
        is_test_bank: true,
      })),
    ],
    [],
  );

export const testInstitutions = buildTestInstitutions([
  mxTestInstitutions,
  finicityTestInstitutions,
  sophtronTestInstitutions,
  akoyaTestInstitutions,
  [testChaseBankToFilter, mxAndSophtronTestInstitution],
]);

export const addTestInstitutions = (institutions: CachedInstitution[]) => [
  ...institutions,
  ...testInstitutions,
];
