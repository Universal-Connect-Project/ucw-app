import { FinicityAdapter } from "./adapter";
import {
  createFinicitySandboxDataAdapter,
  createFinicityProdDataAdapter,
} from "./dataAdapter";
import type { AdapterDependencies } from "./models";

export const getFinicityAdapterMapObject = (
  dependencies: AdapterDependencies,
) => {
  return {
    finicity: {
      testInstitutionAdapterName: "finicity_sandbox",
      dataAdapter: createFinicityProdDataAdapter(dependencies),
      createWidgetAdapter: () =>
        new FinicityAdapter({
          sandbox: false,
          dependencies,
        }),
    },
    finicity_sandbox: {
      dataAdapter: createFinicitySandboxDataAdapter(dependencies),
      createWidgetAdapter: () =>
        new FinicityAdapter({
          sandbox: true,
          dependencies,
        }),
    },
  };
};

export * from "./models";
