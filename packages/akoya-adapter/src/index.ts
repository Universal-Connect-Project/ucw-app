import { AkoyaAdapter } from "./adapter";
import * as contract from "@repo/utils";
import { createAkoyaProdDataAdapter, createAkoyaSandboxDataAdapter } from "./dataAdapter";
import type { AdapterDependencies } from "./models";

export const getAkoyaAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    akoya: {
      testInstitutionAdapterName: "akoya_sandbox",
      dataAdapter: createAkoyaProdDataAdapter(dependencies),
      createWidgetAdapter: ({sessionId}: {sessionId: string}) => new AkoyaAdapter({
        sandbox: false,
        sessionId,
        dependencies
      })
    },
    akoya_sandbox: {
      dataAdapter: createAkoyaSandboxDataAdapter(dependencies),
      createWidgetAdapter: ({sessionId}: {sessionId: string}) => new AkoyaAdapter({
        sandbox: true,
        sessionId,
        dependencies
      })
    }
  };
};

export * from "./models";
export { contract };
