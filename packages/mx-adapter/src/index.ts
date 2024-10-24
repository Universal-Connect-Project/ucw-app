import { MxAdapter } from "./adapter";
import * as contract from "./contract";
import { createMxIntGetVC, createMxProdGetVC } from "./createVc";
import type { AdapterDependencies } from "./models";

export const getMxAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    mx: {
      testInstitutionAdapterName: "mx_int",
      vcAdapter: createMxProdGetVC(dependencies),
      widgetAdapter: new MxAdapter({
        int: false,
        dependencies
      })
    },
    mx_int: {
      vcAdapter: createMxIntGetVC(dependencies),
      widgetAdapter: new MxAdapter({
        int: true,
        dependencies
      })
    }
  };
};

export * from "./models";
export { contract };
