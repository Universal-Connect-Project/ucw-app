export type ApiCredentials = {
  clientId?: string;
  secret?: string;
  basePath?: string;
  aggregator?: string;
  apiVersion?: string;
};

export type CacheClient = {
  set: (key: string, value: unknown, params?: unknown) => Promise<void> | void;
  get: (key: string) => Promise<unknown> | unknown;
};

export type LogClient = {
  info: (message: string, error?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
  trace: (message: string, data?: unknown) => void;
  warning: (message: string, data?: unknown) => void;
};

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: Record<string, ApiCredentials>;
  envConfig: Record<string, string>;
};

export type AdapterConfig = {
  sandbox: boolean;
  dependencies: AdapterDependencies;
};

export type VCDependencies = {
  logClient: LogClient;
  aggregatorCredentials: unknown;
  envConfig: Record<string, string>;
};
