import { getMxAdapterMapObject } from "@ucp-npm/mx-adapter";

import config from "./config";
import aggregatorCredentials from "./aggregatorCredentials";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { SophtronAdapter } from "./adapters/sophtron";
import * as logger from "./infra/logger";
import { get, set, REDIS_CONSTANTS } from "./services/storageClient/redis";
import getSophtronVc from "./services/vcAggregators/sophtronVc";

const sophtronAdapterMapObject = {
  sophtron: {
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter()
  }
};

// This is where you add adapters
export const adapterMap = {
  ...getMxAdapterMapObject({
    cacheClient: {
      set: set,
      get: get,
      constants: REDIS_CONSTANTS
    },
    logClient: logger,
    aggregatorCredentials,
    serverConfig: config
  }),
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject
};

export type Aggregator = keyof typeof adapterMap
export const aggregators = Object.keys(adapterMap);
