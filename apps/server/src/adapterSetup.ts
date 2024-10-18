import { getMxAdapterMapObject as mxAdapterMapObject } from "@ucp-npm/mx-adapter";

import config from "./config";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { SophtronAdapter } from "./adapters/sophtron";
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";
import getSophtronVc from "./services/vcAggregators/sophtronVc";
import aggregatorCredentials from "./aggregatorCredentials";

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter(),
  },
};

// This is where you add adapters
export const adapterMap = {
  ...mxAdapterMapObject({
    cacheClient: {
      set: set,
      get: get,
    },
    logClient: logger,
    aggregatorCredentials: {
      mxInt: aggregatorCredentials.mxInt,
      mxProd: aggregatorCredentials.mxProd,
    },
    envConfig: {
      HOSTURL: config.HOSTURL,
      MXCLIENTID: config.MXCLIENTID,
      MXAPISECRET: config.MXAPISECRET,
      MXCLIENTIDPROD: config.MXCLIENTIDPROD,
      MXAPISECRETPROD: config.MXAPISECRETPROD,
    },
  }),
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
