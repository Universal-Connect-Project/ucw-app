import axios, { AxiosInstance } from "axios";
import type {
  ApiCredentials,
  AggregatorCredentials,
  Transaction,
  Customer,
  Account,
  AccountOwner,
} from "./models";
import { CacheClient, LogClient } from "@repo/utils";

export const FINICITY_TOKEN_REDIS_KEY = "finicityAccessToken";

function makeFinicityAuthHeaders(apiConfig: ApiCredentials, token: string) {
  return {
    "Finicity-App-Key": apiConfig.appKey,
    "Finicity-App-Token": token,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export const BASE_PATH = "https://api.finicity.com";

export default class FinicityClient {
  apiConfig: ApiCredentials;
  logger: LogClient;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
  basePath = "https://api.finicity.com";
  aggregator: "finicity_sandbox" | "finicity";
  cacheClient: CacheClient;
  axios: AxiosInstance;

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

  getCustomers(ucpUserId: string) {
    return this.get("aggregation/v1/customers", {
      username: ucpUserId,
    }).then((res: { customers: Customer[] }) => res.customers?.[0]);
  }

  async getCustomer(ucpUserId: string): Promise<Customer> {
    try {
      return (await this.get(
        `/aggregation/v1/customers/${ucpUserId}`,
      )) as Customer;
    } catch {
      return this.getCustomers(ucpUserId);
    }
  }

  async refreshAccountsToAggregateTransactions(customerId: string) {
    return this.post(`aggregation/v2/customers/${customerId}/accounts`, {});
  }

  getCustomerAccountsByInstitutionLoginId(
    customerId: string,
    institutionLoginId: string,
  ) {
    return this.get(
      `aggregation/v1/customers/${customerId}/institutionLogins/${institutionLoginId}/accounts`,
    ).then((res: { accounts: Account[] }) => res.accounts);
  }

  getAccountOwnerDetail(customerId: string, accountId: string) {
    return this.get(
      `aggregation/v3/customers/${customerId}/accounts/${accountId}/owner`,
    ).then((res: { holders: AccountOwner[] }) => res.holders);
  }

  getAccountAchDetail(customerId: string, accountId: string) {
    return this.get(
      `aggregation/v1/customers/${customerId}/accounts/${accountId}/details`,
    );
  }

  async getTransactions(
    customerId: string,
    accountId: string,
    fromDate: string,
    toDate: string,
  ) {
    const params = {
      fromDate: String(Math.floor(new Date(fromDate).getTime() / 1000)),
      toDate: String(Math.floor(new Date(toDate).getTime() / 1000)),
      limit: "100",
    };

    return this.get(
      `aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`,
      params,
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
    }).then((ret: { link: string }) => ret.link);
  }

  createCustomer(unique_name: string) {
    return this.post(
      `aggregation/v2/customers/${this.aggregator === "finicity" ? "active" : "testing"}`,
      {
        username: unique_name,
        firstName: "John",
        lastName: "Smith",
        phone: "1-801-984-4200",
        email: "myname@mycompany.com",
      },
    );
  }

  async deleteCustomer(customerId: string) {
    return this.delete(`aggregation/v1/customers/${customerId}`);
  }

  async post(path: string, body: Record<string, string | number | boolean>) {
    return this.request("post", path, undefined, body).then((res) => res.data);
  }
  async get(
    path: string,
    params: Record<string, string> = null,
  ): Promise<unknown> {
    return this.request("get", path, params).then((res) => res.data);
  }

  async delete(path: string) {
    return this.request("delete", path);
  }

  async getAxiosInstance() {
    if (this.axios) {
      return this.axios;
    }

    const token = await this.getAuthToken();
    const headers = makeFinicityAuthHeaders(this.apiConfig, token);
    return (this.axios = axios.create({
      baseURL: BASE_PATH,
      headers,
    }));
  }

  async request(
    method: string,
    url: string,
    params: Record<string, string> = {},
    data: Record<string, string | number | boolean> = undefined,
  ) {
    const axios = await this.getAxiosInstance();

    return axios
      .request({
        url,
        method,
        params,
        data,
      })
      .catch((err) => {
        this.logger.error(
          `Error at finicityClient.${method} ${url}`,
          err?.response?.data || err,
        );
        throw new Error(err?.response?.data?.message, {
          cause: {
            statusCode: err.status || 400,
          },
        });
      });
  }
}
