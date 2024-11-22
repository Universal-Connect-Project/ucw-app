import { getMxAdapterMapObject } from "@ucp-npm/mx-adapter";
import type { AdapterMap } from "@repo/utils";

import config from "./config";
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";
import { SophtronAdapter } from "./adapters/sophtron";

import getSophtronVc, {
  dataAdapter as sophtronDataAdapter,
} from "./services/vcAggregators/sophtronVc";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

const sophtronAdapterMapObject: Record<string, AdapterMap> = {
  sophtron: {
    dataAdapter: sophtronDataAdapter,
    vcAdapter: getSophtronVc,
    widgetAdapter: new SophtronAdapter(),
  },
};

const mxAdapterMapObject: Record<string, AdapterMap> = getMxAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    mxInt: {
      username: config.MxClientId,
      password: config.MxApiSecret,
      basePath: "https://int-api.mx.com",
      vcEndpoint: "https://int-api.mx.com/",
      aggregator: "mx_int",
      available: true,
    },
    mxProd: {
      username: config.MxClientIdProd,
      password: config.MxApiSecretProd,
      basePath: "https://api.mx.com",
      vcEndpoint: "https://api.mx.com/",
      aggregator: "mx",
      available: true,
    },
  },
  envConfig: {
    HOSTURL: config.HOSTURL,
  },
});

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
