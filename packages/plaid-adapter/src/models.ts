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
  getUcpIdFromAggregatorInstitutionCode: (
    aggregator: string,
    institutionCode: string,
  ) => Promise<string | null>;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
};
