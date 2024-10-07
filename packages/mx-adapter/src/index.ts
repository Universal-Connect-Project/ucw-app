import { MxAdapter } from "./adapter";
import {
  MX_EXAMPLE_A_LABEL_TEXT,
  MX_EXAMPLE_A_PROVIDER_STRING,
  MX_EXAMPLE_B_LABEL_TEXT,
  MX_EXAMPLE_B_PROVIDER_STRING,
  MX_EXAMPLE_C_LABEL_TEXT,
  MX_EXAMPLE_C_PROVIDER_STRING
} from "./constants";

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

export {
  MX_EXAMPLE_A_LABEL_TEXT,
  MX_EXAMPLE_B_LABEL_TEXT,
  MX_EXAMPLE_C_LABEL_TEXT,
  MX_EXAMPLE_A_PROVIDER_STRING,
  MX_EXAMPLE_B_PROVIDER_STRING,
  MX_EXAMPLE_C_PROVIDER_STRING
};

export * from "./models";
export { contract };
