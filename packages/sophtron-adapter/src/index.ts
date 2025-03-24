import { type AdapterMap } from "@repo/utils";
import { createDataAdapter } from "./createDataAdapter";

import { SophtronAdapter } from "./adapter";
import { createSophtronVC } from "./createVc";
import type { AdapterDependencies } from "./models";

export const getSophtronAdapterMapObject = (
  dependencies: AdapterDependencies,
) => {
  return {
    sophtron: {
      dataAdapter: createDataAdapter(dependencies),
      vcAdapter: createSophtronVC(dependencies),
      createWidgetAdapter: () =>
        new SophtronAdapter({
          dependencies,
        }),
    } as AdapterMap,
  } as Record<string, AdapterMap>;
};

export * from "./models";
