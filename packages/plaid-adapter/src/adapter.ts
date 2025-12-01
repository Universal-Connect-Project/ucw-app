import type {
  AggregatorInstitution,
  ApiResponse,
  CacheClient,
  Connection,
  ConnectionContext,
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
  getItem,
} from "./apiClient";
import { calculateDurationFromEvents } from "./durationRecording/calculateDurationFromEvents";

type AdapterConfig = {
  sandbox: boolean;
  dependencies: AdapterDependencies;
};

export class PlaidAdapter implements WidgetAdapter {
  aggregator: string;
  aggregatorDisplayName = "Plaid";
  getWebhookHostUrl: () => string;
  credentials: ApiCredentials;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;
  sandbox: boolean;
  performanceClient: PerformanceClient;
  requiresPollingForPerformance = false; // The webhook negates the need for polling

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

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    return {
      id,
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
    const connectionId = request.connectionId;
    const tokenObj = await createPlaidLinkToken({
      sandbox: this.sandbox,
      clientName: this.credentials.clientName,
      clientId: this.credentials.clientId,
      secret: this.credentials.secret,
      userId,
      webhookHostUrl: this.getWebhookHostUrl(),
      jobTypes: request.jobTypes,
      state: connectSessionId,
      accessToken: connectionId,
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
    if (!connection) {
      return null;
    }
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

  private async recordSuccessIfIntitialInstitutionWasConnected({
    requestId,
    accessToken,
    initialInstitutionId,
  }: {
    requestId: string;
    accessToken: string;
    initialInstitutionId: string;
  }) {
    this.performanceClient.recordConnectionPauseEvent({
      connectionId: requestId,
    });
    const getItemReq = await getItem({
      accessToken,
      clientId: this.credentials.clientId,
      secret: this.credentials.secret,
      sandbox: this.sandbox,
    });

    if (initialInstitutionId === getItemReq.data.item.institution_id) {
      this.performanceClient.recordSuccessEvent(requestId, accessToken);
    }
  }

  async HandleOauthResponse(request: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: Record<string, any>;
  }): Promise<Connection> {
    const { connection_id: requestId } = request?.query || {};
    this.logger.trace(
      `Received plaid oauth redirect response ${requestId}, type: ${request.body.webhook_code}`,
    );
    const connection = (await this.cacheClient.get(requestId)) as Connection;
    const connectionContext = (await this.cacheClient.get(
      `context_${requestId}`,
    )) as ConnectionContext;
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

      connection.successWebhookReceivedAt = new Date().toISOString();
      await this.recordSuccessIfIntitialInstitutionWasConnected({
        requestId,
        accessToken: access_token,
        initialInstitutionId: connectionContext?.aggregatorInstitutionId,
      });

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
      this.logger.info(
        `Received webhook event for connection ${requestId} with data: ${JSON.stringify(
          request.body,
        )}`,
      );
      // https://plaid.com/docs/api/link/#events
      if (!connection.successWebhookReceivedAt) {
        return connection;
      }
      connection.status = ConnectionStatus.CONNECTED;
      const connectionDuration = calculateDurationFromEvents(
        request.body.events,
        connection.successWebhookReceivedAt, // this is a fallback in case the link widget gets closed before HANDOFF happens
      );
      if (connectionDuration) {
        this.performanceClient.updateConnectionDuration({
          connectionId: requestId,
          additionalDuration: connectionDuration,
        });
      }
    } else if (webhook_code === "SESSION_FINISHED") {
      if (connection.successWebhookReceivedAt) {
        connection.status = ConnectionStatus.CONNECTED;
      } else {
        connection.status = ConnectionStatus.FAILED;
      }
    }

    await this.cacheClient.set(requestId, connection);

    return connection;
  }
}
