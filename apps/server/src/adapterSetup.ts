import type { AdapterMap } from "@repo/utils";
import { getTemplateAdapterMapObject } from "@ucp-npm/template-adapter";
import { getFinicityAdapterMapObject } from "@ucp-npm/finicity-adapter";
import { adapterMapObject as testAdapterMapObject } from "./test-adapter";
import aggregatorCredentials from './aggregatorCredentials'

import config from "./config";
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";

const templateAdapterMapObject = getTemplateAdapterMapObject();
const finicityAdapterMapyObject = getFinicityAdapterMapObject({
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

// This is where you add adapters
export const adapterMap: Record<string, AdapterMap> = {
  ...finicityAdapterMapyObject,
  ...templateAdapterMapObject,
  ...testAdapterMapObject,
};
export type Aggregator = keyof typeof adapterMap;
export const aggregators = Object.keys(adapterMap);
