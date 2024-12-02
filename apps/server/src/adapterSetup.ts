import { getMxAdapterMapObject } from "@ucp-npm/mx-adapter";
import { getSophtronAdapterMapObject } from "@ucp-npm/sophtron-adapter";
import type { AdapterMap } from "@repo/utils";

import config from "./config";
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";

import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import { getTemplateAdapterMapObject } from "@ucp-npm/template-adapter";

const templateAdapterMapObject = getTemplateAdapterMapObject();

const sophtronAdapterMapObject: Record<string, AdapterMap> =
  getSophtronAdapterMapObject({
    logClient: logger,
    aggregatorCredentials: {
      clientId: config.SophtronApiUserId,
      secret: config.SophtronApiUserSecret,
    },
    envConfig: {
      HOSTURL: config.HOSTURL,
    },
  });

const mxAdapterMapObject = getMxAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    mxInt: {
      username: config.MxClientId,
      password: config.MxApiSecret,
    },
    mxProd: {
      username: config.MxClientIdProd,
      password: config.MxApiSecretProd,
    },
  },
  envConfig: {
    HOSTURL: config.HOSTURL,
  },
});

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...templateAdapterMapObject,
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
