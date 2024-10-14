import { enc } from "crypto-js";
import config from "../config";
import { get, post } from "../infra/http";

const version = "v2";

function makeAkoyaAuthHeaders(apiConfig) {
  const words = enc.Utf8.parse(`${apiConfig.clientId}:${apiConfig.secret}`);
  return {
    Authorization: `Basic ${enc.Base64.stringify(words)}`,
    "content-type": "application/x-www-form-urlencoded",
    accept: "application/json",
  };
}

function makeAkoyaBearerHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };
}

export default class AkoyaClient {
  constructor(apiConfig) {
    this.apiConfig = apiConfig;
    this.client_redirect_url = `${config.HOSTURL}/oauth/${this.apiConfig.aggregator}/redirect_from`;
    this.authParams = {
      client_id: apiConfig.clientId,
      client_secret: apiConfig.secret,
    };
  }

  getOauthUrl(institutionId, clientRedirectUrl, state) {
    return `https://${this.apiConfig.basePath}/auth?connector=${institutionId}&client_id=${this.apiConfig.clientId}&redirect_uri=${clientRedirectUrl}&state=${state}&response_type=code&scope=openid email profile offline_access`;
  }

  async getIdToken(authCode) {
    const body = {
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: this.client_redirect_url,
    };
    // let body = `grant_type=authorization_code&code=${authCode}`; //&redirect_uri=${this.client_redirect_url}
    return await this.post("token", body);
  }

  async refreshToken(existingRefreshToken) {
    return await this.post("token", {
      grant_type: "refresh_token",
      refresh_token: existingRefreshToken,
      client_id: this.apiConfig.clientId,
      client_secret: this.apiConfig.secret,
    });
  }

  async getAccountInfo(institutionId, accountIds, token) {
    return await this.get(
      `accounts-info/${version}/${institutionId}`,
      token,
    ).then((res) => res.accounts);
  }

  async getBalances(institutionId, token) {
    return await this.get(`balances/${version}/${institutionId}`, token);
  }

  async getInvestments(institutionId, token) {
    return await this.get(`accounts/${version}/${institutionId}`, token);
  }

  async getPayments(institutionId, accountId, token) {
    return await this.get(
      `payments/${version}/${institutionId}/${accountId}/payment-networks`,
      token,
    );
  }

  async getTransactions(institutionId, accountId, token) {
    return await this.get(
      `transactions/${version}/${institutionId}/${accountId}?offset=0&limit=50`,
      token,
    );
  }

  async getCustomerInfo(institutionId, token) {
    return await this.get(
      `customers/${version}/${institutionId}/current`,
      token,
    );
  }

  async post(path, body) {
    const headers = makeAkoyaAuthHeaders(this.apiConfig);
    return await post(
      `https://${this.apiConfig.basePath}/${path}`,
      body,
      headers,
    );
  }

  async get(path, token) {
    const headers = makeAkoyaBearerHeaders(token);
    return await get(`https://${this.apiConfig.productPath}/${path}`, headers);
  }
}
