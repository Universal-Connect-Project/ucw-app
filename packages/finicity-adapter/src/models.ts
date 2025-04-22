import { CacheClient, LogClient } from "@repo/utils";

export type ApiCredentials = {
  secret?: string;
  partnerId?: string;
  appKey?: string;
};

export interface AggregatorCredentials {
  finicitySandbox: ApiCredentials;
  finicityProd: ApiCredentials;
}

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: AggregatorCredentials;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
};

export type AdapterConfig = {
  sandbox: boolean;
  sessionId?: string;
  dependencies: AdapterDependencies;
};

export type DataAdapterDependencies = {
  logClient: LogClient;
  aggregatorCredentials: AggregatorCredentials;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
};
