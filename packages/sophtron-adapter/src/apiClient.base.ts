import type { AdapterDependencies, IHttpClient } from "./models";
import { apiEndpoint } from "./consts";
import { buildSophtronAuthCode } from "./utils";
import HttpClient from "./httpClient";
import type { LogClient } from "@repo/utils";

export default class SophtronBaseClient {
  apiConfig: any;
  logClient: LogClient;
  httpClient: IHttpClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterDependencies) {
    const { aggregatorCredentials, logClient, envConfig } = args;

    this.apiConfig = aggregatorCredentials;
    this.logClient = logClient;
    this.envConfig = envConfig;
    this.httpClient = new HttpClient(args);
  }

  getAuthHeaders(method: string, path: string) {
    return {
      Authorization: buildSophtronAuthCode(
        method,
        path,
        this.apiConfig.clientId,
        this.apiConfig.secret,
      ),
    };
  }

  async post(path: string, data?: any) {
    const authHeader = this.getAuthHeaders("post", path);
    return await this.httpClient.post(apiEndpoint + path, data, authHeader);
  }

  async get(path: string) {
    const authHeader = this.getAuthHeaders("get", path);
    return await this.httpClient.get(apiEndpoint + path, authHeader);
  }

  async put(path: string, data: any) {
    const authHeader = this.getAuthHeaders("put", path);
    return await this.httpClient.put(apiEndpoint + path, data, authHeader);
  }

  async del(path: string) {
    const authHeader = this.getAuthHeaders("delete", path);
    return await this.httpClient.del(apiEndpoint + path, authHeader);
  }
}
