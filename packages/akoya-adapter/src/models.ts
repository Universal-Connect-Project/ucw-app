import type { CacheClient, LogClient, PerformanceClient } from "@repo/utils";

export type ApiCredentials = {
  clientId?: string;
  secret?: string;
};

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  performanceClient: PerformanceClient;
  aggregatorCredentials: Record<string, ApiCredentials>;
  envConfig: Record<string, string>;
};
