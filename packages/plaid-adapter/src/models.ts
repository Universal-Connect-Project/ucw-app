import type { CacheClient, LogClient, PerformanceClient } from "@repo/utils";

export type ApiCredentials = {
  clientName?: string;
  clientId?: string;
  secret?: string;
};

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: Record<string, ApiCredentials>;
  performanceClient: PerformanceClient;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
};

export type DataAdapterDependencies = {
  logClient: LogClient;
  aggregatorCredentials: Record<string, ApiCredentials>;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
  cacheClient: CacheClient;
};
