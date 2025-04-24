import type { AdapterMap } from "@repo/utils";
import { MxAdapter } from "./adapter";
import { createMxIntGetVC, createMxProdGetVC } from "./createVc";
import type { AdapterDependencies } from "./models";
import { createMxIntDataAdapter, createMxProdDataAdapter } from "./dataAdapter";

const MX_AGGREGATOR_STRING = "mx";
const MX_INT_AGGREGATOR_STRING = "mx_int";

export const getMxAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    [MX_AGGREGATOR_STRING]: {
      dataAdapter: createMxProdDataAdapter(dependencies),
      testAdapterId: MX_INT_AGGREGATOR_STRING,
      vcAdapter: createMxProdGetVC(dependencies),
      createWidgetAdapter: () =>
        new MxAdapter({
          int: false,
          dependencies: dependencies,
        }),
    } as AdapterMap,
    [MX_INT_AGGREGATOR_STRING]: {
      dataAdapter: createMxIntDataAdapter(dependencies),
      vcAdapter: createMxIntGetVC(dependencies),
      createWidgetAdapter: () =>
        new MxAdapter({
          int: true,
          dependencies: dependencies,
        }),
    } as AdapterMap,
  } as Record<string, AdapterMap>;
};

export * from "./models";
