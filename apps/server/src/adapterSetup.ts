import { SophtronAdapter } from "./adapters/sophtron";

import getSophtronVc from "./services/vcAggregators/sophtronVc";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter(),
  },
};

// This is where you add adapters
export const adapterMap = {
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
