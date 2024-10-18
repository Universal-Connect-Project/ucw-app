import { MxAdapter } from "./adapter";
import * as contract from "./contract";
import { mxIntGetVC, mxProdGetVC } from "./createVc";
import type { AdapterDependencies } from "./models";

export const getMxAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    mx: {
      testInstitutionAdapterName: "mx_int",
      vcAdapter: mxProdGetVC(dependencies),
      widgetAdapter: new MxAdapter({
        int: false,
        dependencies
      })
    },
    mx_int: {
      vcAdapter: mxIntGetVC(dependencies),
      widgetAdapter: new MxAdapter({
        int: true,
        dependencies
      })
    }
  };
};

export * from "./models";
export { contract };
