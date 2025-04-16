import type { AdapterMap } from "@repo/utils";
import { getMxAdapterMapObject } from "@repo/mx-adapter";
import { getSophtronAdapterMapObject } from "@repo/sophtron-adapter";
import { getFinicityAdapterMapObject } from "@repo/finicity-adapter";
import config from "./config";
import * as logger from "./infra/logger";
import { get, set } from "./services/storageClient/redis";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";

const mxAdapterMapObject = getMxAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    mxInt: {
      username: config.MX_CLIENT_ID,
      password: config.MX_API_SECRET,
    },
    mxProd: {
      username: config.MX_CLIENT_ID_PROD,
      password: config.MX_API_SECRET_PROD,
    },
  },
  envConfig: {
    HOSTURL: config.HOST_URL,
    PROXY_HOST: config.PROXY_HOST,
    PROXY_PORT: config.PROXY_PORT,
    PROXY_USERNAME: config.PROXY_USERNAME,
    PROXY_PASSWORD: config.PROXY_PASSWORD,
  },
});

const sophtronAdapterMapObject: Record<string, AdapterMap> =
  getSophtronAdapterMapObject({
    logClient: logger,
    aggregatorCredentials: {
      clientId: config.SOPHTRON_API_USER_ID,
      secret: config.SOPHTRON_API_USER_SECRET,
    },
    envConfig: {
      HOSTURL: config.HOST_URL,
    },
  });

const finicityAdapterMapObject: Record<string, AdapterMap> =
  getFinicityAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    finicitySandbox: {
      partnerId: config.FINICITY_PARTNER_ID,
      appKey: config.FINICITY_APP_KEY,
      secret: config.FINICITY_SECRET,
    },
    finicityProd: {
      partnerId: config.FINICITY_PARTNER_ID_PROD,
      appKey: config.FINICITY_APP_KEY_PROD,
      secret: config.FINICITY_SECRET_PROD,
    }
  },
  envConfig: {
    HostUrl: config.HOST_URL,
    WebhookHostUrl: config.WEBHOOK_HOST_URL
  },
});

export const adapterMap: Record<string, AdapterMap> = {
  ...finicityAdapterMapObject,
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
