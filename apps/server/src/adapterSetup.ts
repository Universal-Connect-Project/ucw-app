import type { AdapterMap } from "@repo/utils";
import { getMxAdapterMapObject } from "@repo/mx-adapter";
import { getSophtronAdapterMapObject } from "@repo/sophtron-adapter";
import { getAkoyaAdapterMapObject } from "@repo/akoya-adapter";
import { getPlaidAdapterMapObject } from "@repo/plaid-adapter";
import { getFinicityAdapterMapObject } from "@repo/finicity-adapter";
import config from "./config";
import * as logger from "./infra/logger";
import { get, set } from "./services/storageClient/redis";
import { getWebhookHostUrl } from "./webhooks";
import {
  recordConnectionPauseEvent,
  recordConnectionResumeEvent,
  recordStartEvent,
  recordSuccessEvent,
  updateConnectionDuration,
} from "./services/performanceTracking";

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
    performanceClient: {
      recordStartEvent: recordStartEvent,
      recordSuccessEvent: recordSuccessEvent,
      recordConnectionPauseEvent: recordConnectionPauseEvent,
      recordConnectionResumeEvent: recordConnectionResumeEvent,
    },
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
      },
    },
    getWebhookHostUrl: getWebhookHostUrl,
    envConfig: {
      HostUrl: config.HOST_URL,
    },
  });

const akoyaAdapterMapObject: Record<string, AdapterMap> =
  getAkoyaAdapterMapObject({
    cacheClient: {
      set: set,
      get: get,
    },
    logClient: logger,
    performanceClient: {
      recordStartEvent: recordStartEvent,
      recordSuccessEvent: recordSuccessEvent,
      recordConnectionPauseEvent: recordConnectionPauseEvent,
      recordConnectionResumeEvent: recordConnectionResumeEvent,
    },
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
      WebhookHostUrl: config.WebhookHostUrl,
    },
  });

const plaidAdapterMapObject: Record<string, AdapterMap> =
  getPlaidAdapterMapObject({
    cacheClient: {
      set: set,
      get: get,
    },
    logClient: logger,
    performanceClient: {
      recordStartEvent,
      recordSuccessEvent,
      recordConnectionPauseEvent,
      recordConnectionResumeEvent,
      updateConnectionDuration,
    },
    aggregatorCredentials: {
      plaidSandbox: {
        clientName: config.PLAID_CLIENT_NAME,
        clientId: config.PLAID_CLIENT_ID,
        secret: config.PLAID_SECRET,
      },
      plaidProd: {
        clientName: config.PLAID_CLIENT_NAME,
        clientId: config.PLAID_CLIENT_ID,
        secret: config.PLAID_SECRET_PROD,
      },
    },
    getWebhookHostUrl: getWebhookHostUrl,
    envConfig: {
      HostUrl: config.HOST_URL,
      WebhookHostUrl: config.WebhookHostUrl,
    },
  });

export const adapterMap: Record<string, AdapterMap> = {
  ...akoyaAdapterMapObject,
  ...finicityAdapterMapObject,
  ...mxAdapterMapObject,
  ...sophtronAdapterMapObject,
  ...plaidAdapterMapObject,
};

const testAdapterKeys = Object.values(adapterMap)
  .map(({ testAdapterId }) => testAdapterId)
  .filter(Boolean);

export const nonTestAggregators = Object.keys(adapterMap).filter(
  (key) => !testAdapterKeys.includes(key),
);

export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
