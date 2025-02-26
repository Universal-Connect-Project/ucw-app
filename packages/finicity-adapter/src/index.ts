import { FinicityAdapter } from "./adapter";
import * as contract from "./contract";
import { createFinicitySandboxGetVC, createFinicityProdGetVC } from "./createVc";
import type { AdapterDependencies } from "./models";

export const getFinicityAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    finicity: {
      testInstitutionAdapterName: "finicity_sandbox",
      vcAdapter: createFinicityProdGetVC(dependencies),
      createWidgetAdapter: ({sessionId}) => new FinicityAdapter({
        sandbox: false,
        sessionId: 'test-session',
        dependencies
      })
    },
    finicity_sandbox: {
      vcAdapter: createFinicitySandboxGetVC(dependencies),
      createWidgetAdapter: ({sessionId}) => new FinicityAdapter({
        sandbox: true,
        sessionId: 'test-session',
        dependencies
      })
    }
  };
};

export * from "./models";
export { contract };
