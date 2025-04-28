import { default as axios, type AxiosInstance } from "axios";
import type {
  ApiCredentials,
  AggregatorCredentials,
  Transaction,
  Customer,
  Account,
  AccountOwner,
} from "./models";
import { CacheClient, LogClient } from "@repo/utils";

const FINICITY_TOKEN_REDIS_KEY = "finicityAccessToken";

function makeFinicityAuthHeaders(apiConfig: ApiCredentials, token: string) {
  return {
    "Finicity-App-Key": apiConfig.appKey,
    "Finicity-App-Token": token,
    accept: "application/json",
  };
}

export const BASE_PATH = "https://api.finicity.com";

export default class FinicityClient {
  apiConfig: ApiCredentials;
  axios: AxiosInstance;
  logger: LogClient;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
  basePath = "https://api.finicity.com";
  aggregator: "finicity_sandbox" | "finicity";
  cacheClient: CacheClient;

  constructor(
    sandbox: boolean,
    aggregatorCredentials: AggregatorCredentials,
    logger: LogClient,
    envConfig: Record<string, string>,
    getWebhookHostUrl: () => string,
    cacheClient: CacheClient,
  ) {
    this.aggregator = sandbox ? "finicity_sandbox" : "finicity";
    (this.apiConfig = sandbox
      ? aggregatorCredentials.finicitySandbox
      : aggregatorCredentials.finicityProd),
      (this.logger = logger);
    this.envConfig = envConfig;
    this.getWebhookHostUrl = getWebhookHostUrl;
    this.cacheClient = cacheClient;
  }

  async getAuthToken() {
    let token = await this.cacheClient.get(FINICITY_TOKEN_REDIS_KEY);
    if (token) {
      return token;
    }

    const response = await fetch(
      this.basePath + "/aggregation/v2/partners/authentication",
      {
        method: "POST",
        headers: {
          "Finicity-App-Key": this.apiConfig.appKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          partnerId: this.apiConfig.partnerId,
          partnerSecret: this.apiConfig.secret,
        }),
      },
    );

    if (!response.ok) {
      this.logger.error("Error getting access token" + response.json());
      throw new Error("Error getting Finicity access token");
    }

    const responseJson = (await response.json()) as { token: string };
    token = responseJson.token;

    await this.cacheClient.set(FINICITY_TOKEN_REDIS_KEY, token, {
      EX: 7100, // ~ 2 hours
    });

    return token;
  }

  getInstitutions() {
    return this.get("institution/v2/institutions").then(
      (ret) => ret.institutions,
    );
  }

  async getInstitution(institutionId: string) {
    return this.newGet(`institution/v2/institutions/${institutionId}`).then(
      // TODO: Fix this type after merge
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ret: { institution: any }) => ret.institution,
    );
  }

  getCustomers() {
    return this.newGet("aggregation/v1/customers").then(
      (ret: { customers: Customer[] }) => ret.customers,
    );
  }

  async getCustomer(ucpUserId: string): Promise<Customer> {
    return this.newGet(`aggregation/v1/customers`, {
      username: ucpUserId,
    }).then((res: { customers: Customer[] }) => res.customers?.[0]);
  }

  getCustomerAccountsByInstitutionLoginId(
    customerId: string,
    institutionLoginId: string,
  ) {
    return this.newGet(
      `aggregation/v1/customers/${customerId}/institutionLogins/${institutionLoginId}/accounts`,
    ).then((res: { accounts: Account[] }) => res.accounts);
  }

  getAccountOwnerDetail(customerId: string, accountId: string) {
    return this.newGet(
      `aggregation/v3/customers/${customerId}/accounts/${accountId}/owner`,
    ).then((res: { holders: AccountOwner[] }) => res.holders);
  }

  getAccountAchDetail(customerId: string, accountId: string) {
    return this.newGet(
      `aggregation/v1/customers/${customerId}/accounts/${accountId}/details`,
    );
  }

  async getTransactions(
    customerId: string,
    accountId: string,
    fromDate: string,
    toDate: string,
  ) {
    const body = {
      fromDate: Math.floor(new Date(fromDate).getTime() / 1000),
      toDate: Math.floor(new Date(toDate).getTime() / 1000),
      limit: 100,
    };

    return this.newGet(
      `aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`,
      body,
    ).then((res: { transactions: Transaction[] }) => res.transactions);
  }

  generateConnectLiteUrl(
    institutionId: string,
    customerId: string,
    request_id: string,
  ) {
    const redir = `${this.getWebhookHostUrl()}/oauth/${this.aggregator}/redirect_from?connection_id=${request_id}`;
    return this.post("connect/v2/generate/lite", {
      language: "en-US",
      partnerId: this.apiConfig.partnerId,
      customerId: customerId,
      institutionId,
      redirectUri: redir,
      webhook: `${this.getWebhookHostUrl()}/webhook/${this.aggregator}/?connection_id=${request_id}`,
      webhookContentType: "application/json",
      // 'singleUseUrl': true,
      // 'experience': 'default',
    }).then((ret) => ret.link);
  }

  generateConnectFixUrl(
    institutionLoginId: string,
    customerId: string,
    request_id: string,
  ) {
    return this.post("connect/v2/generate/fix", {
      language: "en-US",
      partnerId: this.apiConfig.partnerId,
      customerId: customerId,
      institutionLoginId,
      redirectUri: `${this.getWebhookHostUrl()}/oauth/${this.aggregator}/redirect_from?connection_id=${request_id}`,
      webhook: `${this.getWebhookHostUrl()}/webhook/${this.aggregator}/?connection_id=${request_id}`,
      webhookContentType: "application/json",
    }).then((ret) => ret.link);
  }

  createCustomer(unique_name: string) {
    return this.post(
      `aggregation/v2/customers/${this.aggregator === "finicity" ? "active" : "testing"}`,
      {
        username: unique_name,
        firstName: "John",
        lastName: "Smith",
        // applicationId: '123456789',
        phone: "1-801-984-4200",
        email: "myname@mycompany.com",
      },
    );
  }

  deleteCustomer(customerId: string) {
    return this.del(`aggregation/v2/customers/${customerId}`);
  }
  post(path: string, body: any) {
    return this.request("post", path, null, body);
  }
  async newGet(path: string, params: any = null): Promise<unknown> {
    return this.nonAxiosRequest("get", path, params);
  }
  async get(path: string, params: any = null) {
    return this.request("get", path, params);
  }
  del(path: string, params: any = null) {
    return this.request("delete", path, params);
  }
  async nonAxiosRequest(
    method: string,
    url: string,
    params: Record<string, string> = {},
    data: Record<string, string> = undefined,
  ) {
    const token = await this.getAuthToken();
    const headers = makeFinicityAuthHeaders(this.apiConfig, token);

    const urlParams = new URLSearchParams(params);
    const path = `${this.basePath}/${url}?${urlParams}`;
    const response = await fetch(path, {
      method,
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = (await response.json()) as Error;
      console.error(error);
      throw new Error(`${error.message}`, {
        cause: {
          statusCode: response.status,
        },
      });
    }

    return response.json();
  }

  async request(
    method: string,
    url: string,
    params: Record<string, string> = {},
    data: any = undefined,
  ) {
    if (!this.axios) {
      const token = await this.getAuthToken();
      const headers = makeFinicityAuthHeaders(this.apiConfig, token);
      this.axios = axios.create({
        baseURL: this.basePath,
        headers,
      });
    }
    const ret = await this.axios
      .request({
        url: `${url}`,
        method,
        params,
        data,
      })
      .then((res) => {
        console.log("in old request");
        return res.data;
      })
      .catch((err) => {
        this.logger.error(
          `Error at finicityClient.${method} ${url}`,
          err?.response?.data || err,
        );
      });
    return ret;
  }
}
