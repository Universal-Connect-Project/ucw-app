export type CacheClient = {
  set: (key: string, value: any) => Promise<void>;
  get: (key: string) => Promise<any>;
};

export type LogClient = {
  info: (message: string, error?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
  trace: (message: string, data?: any) => void;
  warning: (message: string, data?: any) => void;
}

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: any;
}

export type AdapterConfig = {
  int: boolean;
  dependencies: AdapterDependencies;
}

export enum MappedJobTypes {
  AGGREGATE = "aggregate",
  ALL = "aggregate_identity_verification",
  FULLHISTORY = "aggregate_extendedhistory",
  VERIFICATION = "verification",
  IDENTITY = "aggregate_identity",
}

export type ApiCredentials = Record<string, {
  username: string;
  password: string;
  basePath: string;
  vcEndpoint: string;
  aggregator: string;
  available: boolean;
}>
