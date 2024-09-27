export type ApiCredentials = {
  clientId?: string;
  secret?: string;
  username?: string;
  password?: string;
  partnerId?: string;
  appKey?: string;
  basePath?: string;
  vcEndpoint?: string;
  aggregator?: string;
  available?: boolean;
  [key: string]: any;
}

export type CacheClient = {
  set: (key: string, value: any) => Promise<void> | void;
  get: (key: string) => Promise<any> | any;
  constants: Record<string, string>;
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
  aggregatorCredentials: Record<string, ApiCredentials>;
  envConfig: any;
}

export type AdapterConfig = {
  int: boolean;
  dependencies: AdapterDependencies;
}

export type VCDependencies = {
  logClient: LogClient;
  aggregatorCredentials: any;
};

// export enum MappedJobTypes {
//   AGGREGATE = "aggregate",
//   ALL = "aggregate_identity_verification",
//   FULLHISTORY = "aggregate_extendedhistory",
//   VERIFICATION = "verification",
//   IDENTITY = "aggregate_identity",
// }
