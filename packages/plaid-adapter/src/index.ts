import { PlaidAdapter } from "./adapter";
import type { AdapterDependencies } from "./models";

export const PLAID_AGGREGATOR_STRING = "plaid";

export const getPlaidAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    plaid: {
      testAdapterId: "plaid_sandbox",
      dataAdapter: () => {
        throw new Error("Data adapter not implemented for Plaid");
      },
      createWidgetAdapter: () =>
        new PlaidAdapter({
          sandbox: false,
          dependencies,
        }),
    },
    plaid_sandbox: {
      dataAdapter: () => {
        throw new Error("Data adapter not implemented for Plaid");
      },
      createWidgetAdapter: () =>
        new PlaidAdapter({
          sandbox: true,
          dependencies,
        }),
    },
  };
};

export { testInstitutions } from "./testInstitutions";
