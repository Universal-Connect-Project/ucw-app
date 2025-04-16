import { URL, URLSearchParams } from "url";
import type { LogClient, ApiCredentials } from "./models";

export const AKOYA_BASE_PATH = "https://sandbox-idp.ddp.akoya.com";
export const AKOYA_BASE_PROD_PATH = "https://idp.ddp.akoya.com";

export default class AkoyaClient {
  apiConfig: ApiCredentials;
  client_redirect_url: string;
  authParams: object;
  envConfig: Record<string, string>;
  logger: LogClient;

  constructor(
    sandbox: boolean,
    apiCredentials: ApiCredentials,
    logger: LogClient,
    envConfig: Record<string, string>,
  ) {
    this.apiConfig = {
      ...apiCredentials,
      basePath: sandbox ? AKOYA_BASE_PATH : AKOYA_BASE_PROD_PATH,
      apiVersion: "v2",
      aggregator: sandbox ? "akoya_sandbox" : "akoya",
    };
    this.logger = logger;
    this.envConfig = envConfig;
    this.client_redirect_url = `${this.envConfig.HostUrl}/oauth/${this.apiConfig.aggregator}/redirect_from`;
    this.authParams = {
      client_id: this.apiConfig.clientId,
      client_secret: this.apiConfig.secret,
    };
  }

  getOauthUrl(institutionId: string, state: string): string {
    const baseUrl = new URL("/auth", this.apiConfig.basePath);

    const params = {
      connector: institutionId,
      client_id: this.apiConfig.clientId,
      redirect_uri: this.client_redirect_url,
      state: state,
      response_type: "code",
      scope: "openid profile offline_access",
    };

    baseUrl.search = new URLSearchParams(params).toString();

    return baseUrl.toString();
  }
}
