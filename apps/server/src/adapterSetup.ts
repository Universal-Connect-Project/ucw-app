import type { AdapterMap } from "@repo/utils";
import { getMxAdapterMapObject } from "@repo/mx-adapter";
import { getSophtronAdapterMapObject } from "@repo/sophtron-adapter";
import { getAkoyaAdapterMapObject } from "@repo/akoya-adapter";
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

const akoyaAdapterMapObject: Record<string, AdapterMap> =
  getAkoyaAdapterMapObject({
  cacheClient: {
    set: set,
    get: get,
  },
  logClient: logger,
  aggregatorCredentials: {
    akoyaSandbox: {
      clientId: config.AKOYA_CLIENT_ID,
      secret: config.AKOYA_SECRET,
    },
    akoyaProd: {
      clientId: config.AKOYA_CLIENT_ID_PROD,
      secret: config.AKOYA_SECRET_PROD,
    },
  },
  envConfig: {
    HostUrl: config.HOST_URL,
    WebhookHostUrl: config.WebhookHostUrl
  },
});
  


export const adapterMap: Record<string, AdapterMap> = {
  ...akoyaAdapterMapObject,
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...testAdapterMapObject,
};

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
