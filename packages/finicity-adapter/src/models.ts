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
  envConfig: Record<string, string>;
}

export type AdapterConfig = {
  sandbox: boolean;
  sessionId?: string;
  dependencies: AdapterDependencies;
}

export type VCDependencies = {
  logClient: LogClient;
  aggregatorCredentials: any;
  envConfig: Record<string, string>;
};
