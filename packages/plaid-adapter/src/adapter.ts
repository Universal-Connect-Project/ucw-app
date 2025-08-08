import type {
  AggregatorInstitution,
  ApiResponse,
  CacheClient,
  Connection,
  CreateConnectionRequest,
  Credential,
  LogClient,
  PerformanceClient,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import type { AdapterDependencies, ApiCredentials } from "./models";

import {
  createPlaidLinkToken,
  publicTokenExchange,
  removeItem,
} from "./apiClient";

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
  performanceClient: PerformanceClient;
  requiresPollingForPerformance = false; // The webhook negates the need for polling
  performanceEnabled = false;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.sandbox = sandbox;
    this.aggregator = sandbox ? "plaid_sandbox" : "plaid";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.performanceClient = dependencies?.performanceClient;
    this.credentials = sandbox
      ? dependencies?.aggregatorCredentials.plaidSandbox
      : dependencies?.aggregatorCredentials.plaidProd;
    this.getWebhookHostUrl = dependencies.getWebhookHostUrl;
  }

  getShouldRecordPerformanceDuration() {
    // TODO: https://universalconnect.atlassian.net/browse/UCP-649
    // Duration disabled until future support is added.
    return false;
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
    const connectSessionId = request.performanceSessionId;
    const tokenObj = await createPlaidLinkToken({
      sandbox: this.sandbox,
      clientName: this.credentials.clientName,
      clientId: this.credentials.clientId,
      secret: this.credentials.secret,
      userId,
      webhookHostUrl: this.getWebhookHostUrl(),
      jobTypes: request.jobTypes,
      state: connectSessionId,
    });
    const cacheObj = {
      id: connectSessionId,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: tokenObj.hosted_link_url,
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
    await this.cacheClient.set(connectSessionId, cacheObj, {
      EX: 900, // 15 minutes
    });
    this.logger.debug(
      `plaid adapter creating member with url ${cacheObj.oauth_window_uri}`,
    );
    return cacheObj;
  }

  async DeleteConnection(connectionId: string): Promise<ApiResponse> {
    await this.cacheClient.set(connectionId, null);
    return await removeItem({
      accessToken: connectionId,
      clientId: this.credentials.clientId,
      secret: this.credentials.secret,
      sandbox: this.sandbox,
    });
  }

  async DeleteUser(_userId: string): Promise<void> {
    throw new Error(
      "Plaid doesn't support user deletion, you must delete connections instead",
    );
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

  async HandleOauthResponse(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: Record<string, any>;
  }): Promise<Connection> {
    const { connection_id: requestId } = request?.query || {};
    this.logger.trace(`Received plaid oauth redirect response ${requestId}`);
    const connection = (await this.cacheClient.get(requestId)) as Connection;
    if (!connection) {
      throw new Error("Connection not found");
    }

    const { webhook_code, public_token } = request.body;
    if (webhook_code === "ITEM_ADD_RESULT") {
      const tokenExchangeRequest = await publicTokenExchange({
        publicToken: public_token,
        clientId: this.credentials.clientId,
        secret: this.credentials.secret,
        sandbox: this.sandbox,
      });
      const { access_token } = tokenExchangeRequest;
      // this.performanceClient.recordSuccessEvent(requestId, access_token); # TODO: implement performance success
      connection.status = ConnectionStatus.CONNECTED;
      connection.id = access_token;
      connection.postMessageEventData = {
        memberConnected: {
          connectionId: access_token,
        },
        memberStatusUpdate: {
          connectionId: access_token,
        },
      };
    } else if (webhook_code === "EVENTS") {
      // TODO: implement performance duration - https://universalconnect.atlassian.net/browse/UCP-649
      // This webhook doesn't get called until after the plaid link widget has been closed and could
      // potentially be called as late as 10 minutes after the user has closed the widget.

      this.logger.info(
        `Received webhook event for connection ${requestId} with data: ${JSON.stringify(
          request.body,
        )}`,
      );
    }

    await this.cacheClient.set(requestId, connection);

    return connection;
  }
}
