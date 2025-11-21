import { PlaidAdapter } from "./adapter";
import {
  createPlaidProdDataAdapter,
  createPlaidSandboxDataAdapter,
} from "./dataAdapter";
import type { AdapterDependencies } from "./models";

export const PLAID_AGGREGATOR_STRING = "plaid";
export const PLAID_BANK_UCP_INSTITUTION_ID = "plaidbank";

export const getPlaidAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    plaid: {
      testAdapterId: "plaid_sandbox",
      dataAdapter: createPlaidProdDataAdapter(dependencies),
      userless: true,
      createWidgetAdapter: () =>
        new PlaidAdapter({
          sandbox: false,
          dependencies,
        }),
    },
    plaid_sandbox: {
      dataAdapter: createPlaidSandboxDataAdapter(dependencies),
      userless: true,
      createWidgetAdapter: () =>
        new PlaidAdapter({
          sandbox: true,
          dependencies,
        }),
    },
  };
};

export { testInstitutions } from "./testInstitutions";
