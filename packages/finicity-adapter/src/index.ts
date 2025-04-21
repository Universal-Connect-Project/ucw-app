import { FinicityAdapter } from "./adapter";
import { createFinicitySandboxDataAdapter, createFinicityProdDataAdapter } from "./dataAdapter";
import type { AdapterDependencies } from "./models";

export const getFinicityAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    finicity: {
      testInstitutionAdapterName: "finicity_sandbox",
      dataAdapter: createFinicityProdDataAdapter(dependencies),
      createWidgetAdapter: ({sessionId}: {sessionId: string}) => new FinicityAdapter({
        sandbox: false,
        sessionId: sessionId,
        dependencies
      })
    },
    finicity_sandbox: {
      dataAdapter: createFinicitySandboxDataAdapter(dependencies),
      createWidgetAdapter: ({sessionId}: {sessionId: string} ) => new FinicityAdapter({
        sandbox: true,
        sessionId: sessionId,
        dependencies
      })
    }
  };
};

export * from "./models";
