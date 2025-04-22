import type { LogClient } from "@repo/utils";

export type ApiCredentials = {
  clientId?: string;
  secret?: string;
  [key: string]: any;
};

export type IHttpClient = {
  get: (url: string, headers?: any) => Promise<any | undefined>;
  post: (url: string, data?: any, headers?: any) => Promise<any | undefined>;
  put: (url: string, data: any, headers?: any) => Promise<any | undefined>;
  del: (url: string, headers?: any) => Promise<any | undefined>;
  wget: (url: string) => Promise<any | undefined>;
  stream: (url: string, data: any, target: any) => Promise<any>;
};

export type AdapterDependencies = {
  logClient?: LogClient;
  aggregatorCredentials?: ApiCredentials;
  envConfig?: Record<string, string>;
};

export type AdapterConfig = {
  dependencies: AdapterDependencies;
};

export type VCDependencies = Partial<AdapterDependencies>;
