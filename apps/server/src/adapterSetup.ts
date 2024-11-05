import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { MxAdapter } from "./adapters/mx";
import { SophtronAdapter } from "./adapters/sophtron";

import { mxIntGetVC, mxProdGetVC } from "./services/vcAggregators/mxVc";
import getSophtronVc from "./services/vcAggregators/sophtronVc";
import { getChangeThisAdapterMapObject } from "@ucp-npm/change-this-adapter";

const changeThisAdapterMapObject = getChangeThisAdapterMapObject();

const mxAdapterMapObject = {
  mx: {
    testInstitutionAdapterName: "mx_int",
    vcAdapter: mxProdGetVC,
    widgetAdapter: new MxAdapter(false),
  },
  mx_int: {
    vcAdapter: mxIntGetVC,
    widgetAdapter: new MxAdapter(true),
  },
};

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter(),
  },
};

// This is where you add adapters
export const adapterMap = {
  ...changeThisAdapterMapObject,
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
