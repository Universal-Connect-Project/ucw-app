import { config } from "dotenv";
import { get, REDIS_CONSTANTS, set } from "./services/storageClient/redis";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { getMxAdapterMapObject as mxAdapterMapObject } from "@ucp-npm/mx-adapter";
import { SophtronAdapter } from "./adapters/sophtron";
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
      constants: REDIS_CONSTANTS,
    },
    logClient: logger,
    aggregatorCredentials,
    envConfig: config,
  }),
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
