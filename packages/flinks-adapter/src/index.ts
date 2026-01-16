import { FlinksAdapter } from "./adapter";
import {
  createFlinksSandboxDataAdapter,
  createFlinksProdDataAdapter,
} from "./dataAdapter";
import type { AdapterDependencies } from "./models";

export const FLINKS_AGGREGATOR_STRING = "flinks";

export const getFlinksAdapterMapObject = (
  dependencies: AdapterDependencies,
) => {
  return {
    flinks: {
      testAdapterId: "flinks_sandbox",
      dataAdapter: createFlinksProdDataAdapter(dependencies),
      createWidgetAdapter: () =>
        new FlinksAdapter({
          sandbox: false,
          dependencies,
        }),
    },
    flinks_sandbox: {
      dataAdapter: createFlinksSandboxDataAdapter(dependencies),
      createWidgetAdapter: () =>
        new FlinksAdapter({
          sandbox: true,
          dependencies,
        }),
    },
  };
};

export { testInstitutions } from "./testInstitutions";
