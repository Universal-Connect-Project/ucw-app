import type { AdapterDependencies } from "./models";
import { MxAdapter } from "./adapter";
import {
  MX_EXAMPLE_A_PROVIDER_STRING,
  MX_EXAMPLE_A_LABEL_TEXT,
  MX_EXAMPLE_B_PROVIDER_STRING,
  MX_EXAMPLE_B_LABEL_TEXT,
  MX_EXAMPLE_C_LABEL_TEXT,
  MX_EXAMPLE_C_PROVIDER_STRING
} from "./constants";
import { mxProdGetVC, mxIntGetVC } from "./createVc";

export const getMxAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    mx: {
      testInstitutionAdapterName: 'mx_int',
      vcAdapter: mxProdGetVC,
      widgetAdapter: new MxAdapter({
        int: false,
        dependencies
      })
    },
    mx_int: {
      vcAdapter: mxIntGetVC,
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
