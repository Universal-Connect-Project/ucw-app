import { enc } from "crypto-js";
import axios from "axios";
import type { LogClient, ApiCredentials } from "./models";

export const AKOYA_BASE_PATH = 'https://sandbox-idp.ddp.akoya.com'
export const AKOYA_BASE_PROD_PATH = 'https://idp.ddp.akoya.com'
export const AKOYA_PRODUCT_PATH = "https://sandbox-products.ddp.akoya.com"
export const AKOYA_PRODUCT_PROD_PATH = "https://products.ddp.akoya.com"

function makeAkoyaAuthHeaders(apiConfig: any) {
  const words = enc.Utf8.parse(`${apiConfig.clientId}:${apiConfig.secret}`);
  return {
    Authorization: `Basic ${enc.Base64.stringify(words)}`,
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json",
  };
}

function makeAkoyaBearerHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };
}

export default class AkoyaClient {
  apiConfig: ApiCredentials;
  client_redirect_url: string;
  authParams: object;
  envConfig: Record<string, string>;
  logger: LogClient;

  constructor(sandbox: boolean, apiConfig: ApiCredentials, logger: LogClient, envConfig: Record<string, string>){
    this.apiConfig = sandbox ? {
      ...apiConfig,
      basePath: AKOYA_BASE_PATH,
      productPath: AKOYA_PRODUCT_PATH,
      apiVersion: 'v2',
      aggregator: "akoya_sandbox",
      available: true,
    } : {
      ...apiConfig,
      basePath: AKOYA_BASE_PROD_PATH,
      productPath: AKOYA_PRODUCT_PROD_PATH,
      apiVersion: 'v2',
      aggregator: "akoya",
      available: true,
    };
    this.logger = logger;
    this.envConfig = envConfig;
    this.client_redirect_url = `${this.envConfig.HostUrl}/oauth/${this.apiConfig.aggregator}/redirect_from`;
    this.authParams = {
      client_id: apiConfig.clientId,
      client_secret: apiConfig.secret,
    };
  }

  getOauthUrl(institutionId: string, state: string) {
    return `${this.apiConfig.basePath}/auth?connector=${institutionId}&client_id=${this.apiConfig.clientId}&redirect_uri=${this.client_redirect_url}&state=${state}&response_type=code&scope=openid email profile offline_access`;
  }

  async getIdToken(authCode: string) {
    const body = {
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: this.client_redirect_url,
    };
    // let body = `grant_type=authorization_code&code=${authCode}`; //&redirect_uri=${this.client_redirect_url}
    return await this.post("token", body);
  }

  async refreshToken(existingRefreshToken: string) {
    return await this.post("token", {
      grant_type: "refresh_token",
      refresh_token: existingRefreshToken,
      client_id: this.apiConfig.clientId,
      client_secret: this.apiConfig.secret,
    });
  }

  async getAccountInfo(institutionId: string, accountIds: any, token: string) {
    return await this.get(
      `accounts-info/${this.apiConfig.apiVersion}/${institutionId}`,
      token,
    ).then((res) => res.accounts);
  }

  async getBalances(institutionId: string, token: string) {
    return await this.get(`balances/${this.apiConfig.apiVersion}/${institutionId}`, token);
  }

  async getInvestments(institutionId: string, token: string) {
    return await this.get(`accounts/${this.apiConfig.apiVersion}/${institutionId}`, token);
  }

  async getPayments(institutionId: string, accountId: string, token: string) {
    return await this.get(
      `payments/${this.apiConfig.apiVersion}/${institutionId}/${accountId}/payment-networks`,
      token,
    );
  }

  async getTransactions(institutionId: string, accountId: string, token: string, startTime: string, endTime: string) {
    const ret = await this.get(
      `transactions/${this.apiConfig.apiVersion}/${institutionId}/${accountId}?offset=0&limit=500&startTime=${startTime? new Date(startTime).toISOString() : ''}&endTime=${endTime ? new Date(endTime).toISOString(): ''}`,
      token,
    );
    return ret?.transactions
  }

  async getCustomerInfo(institutionId: string, token: string) {
    const ret = await this.get(
      `customers/${this.apiConfig.apiVersion}/${institutionId}/current`,
      token,
    );
    return ret.customer
  }

  async post(path: string, body: any) {
    const headers = makeAkoyaAuthHeaders(this.apiConfig);
    return await this._post(
      `${this.apiConfig.basePath}/${path}`,
      body,
      headers,
    );
  }

  async get(path: string, token: string) {
    const headers = makeAkoyaBearerHeaders(token);
    return await this._get(`${this.apiConfig.productPath}/${path}`, headers);
  }

  async _get(url: string, headers: any) {
    this.logger.debug(`get request: ${url}`);
    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`error from ${url}`, error.response.data || error);
      throw error;
    }
  }

  async _post(url: string, data: string, headers: any) {
    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      this.logger.error(`error from ${url}`, error.response.data || error);
      throw error;
    }
  }
}