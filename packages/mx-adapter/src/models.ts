import type { CacheClient, LogClient } from "@repo/utils";

export type ApiCredentials = {
  username?: string;
  password?: string;
  [key: string]: any;
};

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: Record<string, ApiCredentials>;
  envConfig: Record<string, string>;
};

export type AdapterConfig = {
  int: boolean;
  dependencies: AdapterDependencies;
};

export type VCDependencies = {
  logClient: LogClient;
  aggregatorCredentials: any;
  envConfig: Record<string, string>;
};
