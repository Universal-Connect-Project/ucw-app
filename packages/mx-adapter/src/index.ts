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
import { getVC } from "./vc";

export const getMxAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    mx: {
      testInstitutionAdapterName: 'mx_int',
      vcAdapter: getVC,
      widgetAdapter: new MxAdapter({
        int: false,
        dependencies
      })
    },
    mx_int: {
      vcAdapter: getVC,
      widgetAdapter: new MxAdapter({
        int: false,
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
