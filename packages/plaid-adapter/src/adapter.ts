import type {
  AggregatorInstitution,
  CacheClient,
  Connection,
  CreateConnectionRequest,
  Credential,
  LogClient,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ConnectionStatus, ComboJobTypes } from "@repo/utils";
import type { AdapterDependencies, ApiCredentials } from "./models";

import { v4 as uuidv4 } from "uuid";

export const PLAID_BASE_PATH = "https://sandbox.plaid.com";
export const PLAID_BASE_PATH_PROD = "https://production.plaid.com";

type AdapterConfig = {
  sandbox: boolean;
  dependencies: AdapterDependencies;
};

export class PlaidAdapter implements WidgetAdapter {
  aggregator: string;
  getWebhookHostUrl: () => string;
  credentials: ApiCredentials;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;
  sandbox: boolean;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.sandbox = sandbox;
    this.aggregator = sandbox ? "plaid_sandbox" : "plaid";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.credentials = sandbox
      ? dependencies?.aggregatorCredentials.plaidSandbox
      : dependencies?.aggregatorCredentials.plaidProd;
    this.getWebhookHostUrl = dependencies.getWebhookHostUrl
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    return {
      id,
      aggregator: this.aggregator,
      supportsOauth: true,
    };
  }

  async ListInstitutionCredentials(_id: string): Promise<Credential[]> {
    return [];
  }

  async ListConnectionCredentials(
    _connectionId: string,
    _userId: string,
  ): Promise<Credential[]> {
    return [];
  }

  async ListConnections(_userId: string): Promise<Connection[]> {
    return [];
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string,
  ): Promise<Connection | undefined> {
    const requestId = uuidv4();
    const tokenObj = await createPlaidLinkToken({
        sandbox: this.sandbox,
        clientName: this.credentials.clientName,
        clientId: this.credentials.clientId,
        secret: this.credentials.secret,
        userId,
        hostUrl: this.envConfig.HostUrl,
        webhookHostUrl: this.getWebhookHostUrl(),
        jobTypes: request.jobTypes,
        state: requestId
      })
    const obj = {
      id: requestId,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: tokenObj.hosted_link_url,
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
    await this.cacheClient.set(requestId, obj, {
      EX: 600, // 10 minutes
    });
    this.logger.debug(
      `plaid adapter creating member with url ${obj.oauth_window_uri}`,
    );
    return obj;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async DeleteConnection(id: string, userId: string): Promise<void> {
    await this.cacheClient.set(id, null);

    return;
  }

  async DeleteUser(_aggregatorUserId: string): Promise<unknown> {
    return;
  }

  async UpdateConnection(
    _request: UpdateConnectionRequest,
  ): Promise<Connection> {
    return;
  }

  async GetConnectionById(connectionId: string): Promise<Connection> {
    return (await this.cacheClient.get(connectionId)) as Connection;
  }

  async GetConnectionStatus(
    connectionId: string,
    _jobId: string,
  ): Promise<Connection> {
    const connection = await this.cacheClient.get(connectionId);
    if (connection.status === ConnectionStatus.CREATED) {
      connection.status = ConnectionStatus.PENDING;
    }
    await this.cacheClient.set(connectionId, connection);
    return connection;
  }

  async AnswerChallenge(
    _request: UpdateConnectionRequest,
    _jobId: string,
  ): Promise<boolean> {
    return;
  }

  async ResolveUserId(id: string) {
    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async HandleOauthResponse(request: any): Promise<Connection> {
    const { connection_id: requestId } = request?.query || {};
    this.logger.trace(`Received plaid oauth redirect response ${requestId}`);
    const connection = (await this.cacheClient.get(requestId)) as Connection;
    if (!connection) {
      throw new Error("Connection failed");
    }

    const { webhook_code, public_token, link_session_id } = request.body;
    if (webhook_code === 'ITEM_ADD_RESULT') {
      connection.status = ConnectionStatus.CONNECTED;
      connection.id = link_session_id;
      connection.postMessageEventData = {
        memberConnected: {
          plaidAuthCode: public_token,
        },
        memberStatusUpdate: {
          plaidAuthCode: public_token,
        },
      };
    }else if(webhook_code === 'EVENTS'){
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = request.body.events?.find((e: any) => e.event_name === 'ERROR' || e.event_name === 'EXIT');
      if(err){
        connection.status = ConnectionStatus.DENIED;
        connection.error_message = JSON.stringify(err.event_metadata)
      }
    }

    await this.cacheClient.set(requestId, connection);

    return connection;
  }
}

interface CreateGetOauthUrlParams {
  sandbox: boolean;
  clientName: string;
  clientId: string;
  secret: string;
  userId: string;
  hostUrl: string;
  webhookHostUrl: string;
  jobTypes: ComboJobTypes[];
  state: string,
}

interface PlaidToken {
  link_token: string
  expiration: Date;
  request_id: string;
  hosted_link_url: string;
}
async function createPlaidLinkToken({
  sandbox,
  clientName,
  clientId,
  secret,
  userId,
  hostUrl,
  webhookHostUrl,
  jobTypes,
  state,
}: CreateGetOauthUrlParams): Promise<PlaidToken> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;
  const aggregator = sandbox ? "plaid_sandbox" : "plaid";

  const completion_redirect_uri = `${hostUrl}/oauth/${aggregator}/redirect_from`;
  const webhook = `${webhookHostUrl}/webhook/${aggregator}/?connection_id=${state}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    client_name: clientName,
    language: "en",
    country_codes: [
      "US"
    ],
    user: {
      client_user_id: userId
    },
    webhook,
    products: [],
    hosted_link: {
      completion_redirect_uri
    }
  }
  // https://plaid.com/docs/api/link/#link-token-create-request-transactions
  // auth, transactions, identity, identity_verification, transfer, statements, investments, investments_auth, update, 

  if(jobTypes.includes(ComboJobTypes.TRANSACTION_HISTORY)){
    body.transactions = {
      days_requested: 730
    }
    body.products.push('transactions')
  }else if(jobTypes.includes(ComboJobTypes.TRANSACTIONS)){
    body.transactions = {
      days_requested: 90
    }
    body.products.push('transactions')
  }
  if(jobTypes.includes(ComboJobTypes.ACCOUNT_OWNER)){
    body.identity = {}
    body.products.push('identity')
  }
  if(jobTypes.includes(ComboJobTypes.ACCOUNT_NUMBER)){
    body.auth = {}
    body.products.push('auth')
  }
  if(body.auth && ! body.identity && !body.transactions){
    throw new Error('Unsupported job type for plaid')
  }
  const response = await fetch(
    basePath + "/link/token/create",
    {
      method: "POST",
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await response.json() as PlaidToken;
}
