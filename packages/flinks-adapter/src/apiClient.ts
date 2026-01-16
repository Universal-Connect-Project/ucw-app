import type {
  ApiCredentials,
  AggregatorCredentials,
  GetAccountsSummaryResponse,
  GetAccountStatementsResponse,
  GetAccountDetailsResponse,
} from "./models";
import { CacheClient, LogClient } from "@repo/utils";

export const BASE_PATH = "https://paramountcommercestg-api.private.fin.ag";
export const FLINKS_CONNECT_PATH = 'https://paramountcommercestg-iframe.private.fin.ag/v2/'

export interface Login {
  Username: string;
  IsScheduledRefresh: boolean | false;
  LastRefresh: string;
  Type: string;
  Id: string;
}

export interface Link {
  rel: string;
  href: string;
  example: string;
}

export interface Institution {
  Id: number | 0;
  Name: string;
}

export interface LegacyAuthRequest {
  Institution: string;
  Username: string;
  Password: string;
  MostRecentCached: boolean | false;
  Save: boolean | false;
}

export interface MfaResponse {
  MostRecentCached: boolean | false,
  Save?: boolean | false,
  Tag?: string | undefined,
  LoginId: string,
  RequestId: string,
  SecurityResponses: {
    [question: string]: Array<string>
  }
}

export interface AuthorizeRequest {
  MostRecentCached: boolean | false,
  Save?: boolean | false,
  Tag?: string | undefined,
  LoginId: string,
}

export interface SecurityChallenge {
  Type: string;
  Prompt: string;
}

export default class FlinksClient {
  apiConfig: ApiCredentials;
  logger: LogClient;
  envConfig: Record<string, string>;
  apiBasePath: string;
  aggregator: "flinks_sandbox" | "flinks";
  cacheClient: CacheClient;
  
  constructor(
    sandbox: boolean,
    aggregatorCredentials: AggregatorCredentials,
    logger: LogClient,
    envConfig: Record<string, string>,
    cacheClient: CacheClient,
  ) {
    this.aggregator = sandbox ? "flinks_sandbox" : "flinks";
    this.apiConfig = sandbox
      ? aggregatorCredentials.flinksSandbox
      : aggregatorCredentials.flinks;
    this.logger = logger;
    this.envConfig = envConfig;
    this.cacheClient = cacheClient;
    this.apiBasePath = `https://${this.apiConfig.instance}-api.private.fin.ag/${this.apiConfig.apiVersion || 'v3'}`
  }

  async getConnectUrl(connectSessionId: string, demo: boolean){

    const redirect_uri = `${this.envConfig.HostUrl}/oauth/${this.aggregator}/redirect_from?connection_id=${connectSessionId}`;

    let token: string = '';
    if(this.apiConfig.apiKey){
      token = await this.generateAuthToken();
    }
    return `https://${this.apiConfig.instance}-iframe.private.fin.ag/v2/?redirectUrl=${redirect_uri}&authorizeToken=${token}${demo ? '&demo=true': ''}`
  }

  async getAuthToken(loginId: string){
    return this.callAuthorize({
      LoginId: loginId,
      MostRecentCached: true,
      Save: true,
    })
  }

  // async getOauthUrl(institution_id: string, redirect_uri: string, state: string){
  //   const url = `oauth/authorize?institution_id=${institution_id}&redirect_uri=${redirect_uri}&state=${state}`
  //   const response = await fetch(
  //     url,
  //     {
  //       method: "GET",
  //     },
  //   );
  //   if(response.status === 302){
  //     return response.headers.get('location')
  //   }
  //   this.logger.error("Error getting Flinks oauth url" + response.json());
  //   throw new Error("Error getting Flinks oauth url");
  // }

  // async answerMfa(loginId: string, requestId: string, mfaQuestion: string, mfaResponse: string){
  //   return this.callAuthorize({
  //     LoginId: loginId,
  //     RequestId: requestId,
  //     MostRecentCached: false,
  //     Save: true,
  //     SecurityResponses: {
  //       [mfaQuestion]: [mfaResponse]
  //     }
  //   })
  // }


  // async legacyAuth(institution: string, userName: string, password: string){
  //   return this.callAuthorize({
  //     Institution: institution,
  //     Username: userName,
  //     Password: password,
  //     MostRecentCached: false,
  //     Save: true,
  //   })
  // }

  async generateAuthToken(){
    const response = await fetch(
      `${this.apiBasePath}/${this.apiConfig.customerId}/BankingServices/GenerateAuthorizeToken`,
      {
        method: "POST",
        headers: {
          "x-api-Key": this.apiConfig.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
    if(response.status === 200){
      const json = await response.json() as {
        HttpStatusCode: Number | 0;
        Token: string;
      }
      return json.Token;
    }

    this.logger.error("Error getting Flinks auth token" + response.json());
    throw new Error("Error getting Flinks auth token");
  }

  GetAccountsSummary(requestId: string): Promise<GetAccountsSummaryResponse>  {
    return this.callDataEndpoint('GetAccountsSummary', {
      RequestId: requestId,
      WithBalance: true,
      WithAccountIdentity: true
    })
  }

  GetAccountsSummaryAsync(requestId: string): Promise<GetAccountsSummaryResponse>{
    return this.callAsyncDataEndpoint(requestId, 'GetAccountsSummaryAsync')
  }

  GetAccountsDetail(requestId: string, accountId: string, numberOfDays: number): Promise<GetAccountDetailsResponse>{
    return this.callDataEndpoint('GetAccountsDetail', {
      RequestId: requestId,
      WithAccountIdentity: true,
      WithKYC: true,
      WithTransactions: true,
      AccountsFilter: [accountId],
      // DaysOfTransactions: 'Days' + numberOfDays,
      DaysOfTransactions: 'Days90',
      WithDetailsAndBankingStatements: false,
      NumberOfBankingStatements: 'MostRecent'
    })
  }
  GetAccountsDetailAsync(requestId: string): Promise<GetAccountDetailsResponse> {
    return this.callAsyncDataEndpoint(requestId, 'GetAccountsDetail')
  }

  GetStatements(requestId: string): Promise<GetAccountStatementsResponse> {
    return this.callDataEndpoint('GetStatements', {
      RequestId: requestId,
      AccountsFilter: undefined,
      NumberOfBankingStatements: 'MostRecent'
    })
  }
  GetStatementsAsync(requestId: string): Promise<GetAccountStatementsResponse> {
    return this.callAsyncDataEndpoint(requestId, 'GetStatementsAsync')
  }


  async getInstitutions(take: number | 100, skip: number | 0){
    const response = await fetch(
      `${this.apiBasePath}/${this.apiConfig.customerId}/BankingServices/Institutions?take=${take}&skip=${skip}`,
      {
        method: "GET",
        headers: {
          "x-api-Key": this.apiConfig.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        }
      },
    );
    return response.json();
  }

  async callAuthorize(payload: AuthorizeRequest | MfaResponse | LegacyAuthRequest): Promise<any> {
    const url = `${this.apiBasePath}/${this.apiConfig.customerId}/BankingServices/Authorize`;
    const response = await fetch(
      url,
      {
        method: "POST",
        headers: {
          "x-api-Key": this.apiConfig.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    switch (response.status) {
      case 200:
        const json = (await response.json()) as { 
          RequestId: string;
          HttpStatusCode: number | 0;
          Login: Login;
          Institution: Institution
        };
        return json;
      case 203:
        const responseJson = (await response.json()) as { 
          SecurityChallenges: Array<SecurityChallenge>;
          RequestId: string;
        };
        return responseJson;
      default:
        const message = `Error getting Flinks requestId: ${response.status}, ${await response.text()}`;
        this.logger.error(message);
        throw new Error(message);
    }
  }

  async callDataEndpoint(endpoint: string, payload: any): Promise<any> {
    const url = `${this.apiBasePath}/${this.apiConfig.customerId}/BankingServices/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    } as any;
    if(this.apiConfig.apiKey){
      headers['x-api-Key'] = this.apiConfig.apiKey
    }
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      },
    );

    switch (response.status) {
      case 200:
        const responseJson = await response.json()
        return responseJson;
      case 202:
      default:
        const message = `Error calling Flinks data endpoints: ${response.status}, ${await response.text()}`;
        this.logger.error(message);
        throw new Error(message);
    }
  }

  async callAsyncDataEndpoint(requestId: string, endpoint: string): Promise<any> {
    const response = await fetch(
      `${this.apiBasePath}/${this.apiConfig.customerId}/BankingServices/${endpoint}Async/${requestId}`,
      {
        method: 'GET',
        headers: {
          "x-api-Key": this.apiConfig.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    switch (response.status) {
      case 200:
        const responseJson = await response.json()
        return responseJson;
    }
  }
}
