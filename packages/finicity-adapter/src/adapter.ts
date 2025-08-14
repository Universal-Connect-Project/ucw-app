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
import {
  ComboJobTypes,
  ConnectionStatus,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";
import type { AdapterConfig, Customer } from "./models";
import FinicityClient from "./apiClient";

interface CachedConnection {
  connection?: Connection;
  jobTypes?: ComboJobTypes[];
}

export class FinicityAdapter implements WidgetAdapter {
  aggregator: string;
  apiClient: FinicityClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;
  performanceClient: PerformanceClient;
  requiresPollingForPerformance = false;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.aggregator = sandbox ? "finicity_sandbox" : "finicity";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.performanceClient = dependencies?.performanceClient;
    this.apiClient = new FinicityClient(
      sandbox,
      dependencies?.aggregatorCredentials,
      this.logger,
      this.envConfig,
      dependencies.getWebhookHostUrl,
      this.cacheClient,
    );
  }

  async DeleteUser(userId: string) {
    return await this.apiClient.deleteCustomer(userId);
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
    const connectionId = request.id;
    let oauthWindowUri: string;
    if (connectionId) {
      oauthWindowUri = await this.apiClient.generateConnectFixUrl(
        connectionId,
        userId,
        connectSessionId,
      );
    } else {
      oauthWindowUri = await this.apiClient.generateConnectLiteUrl(
        request.institutionId,
        userId,
        connectSessionId,
      );
    }

    const connection = {
      id: connectSessionId,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: oauthWindowUri,
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
    await this.cacheClient.set(connectSessionId, {
      connection,
      jobTypes: request.jobTypes,
    });
    return connection;
  }

  async DeleteConnection(id: string, userId: string): Promise<ApiResponse> {
    await this.cacheClient.set(id, null);
    await this.DeleteUser(userId);
    return {
      status: 200,
      data: { message: "Connection deleted successfully" },
    };
  }

  async UpdateConnection(
    _request: UpdateConnectionRequest,
  ): Promise<Connection> {
    return null;
  }

  async GetConnectionById(
    connectionId: string,
    userId?: string,
  ): Promise<Connection> {
    const cachedConnection = (await this.cacheClient.get(
      connectionId,
    )) as CachedConnection;

    if (!cachedConnection && connectionId && userId) {
      const connection = {
        id: connectionId,
        userId,
        aggregator: this.aggregator,
        is_oauth: true,
      } as Connection;
      await this.cacheClient.set(connectionId, { connection });
      return connection;
    }
    return cachedConnection?.connection;
  }

  async GetConnectionStatus(
    connectionId: string,
    _jobId?: string,
  ): Promise<Connection> {
    const cachedConnection = (await this.cacheClient.get(
      connectionId,
    )) as CachedConnection;

    if (!cachedConnection) {
      return null;
    }

    const { connection } = cachedConnection;

    if (connection?.status === ConnectionStatus.CREATED) {
      cachedConnection.connection.status = ConnectionStatus.PENDING;
      await this.cacheClient.set(connectionId, {
        ...cachedConnection,
        connection,
      });
    }
    return connection;
  }

  async AnswerChallenge(
    _request: UpdateConnectionRequest,
    _jobId: string,
  ): Promise<boolean> {
    return true;
  }

  async ResolveUserId(userId: string, failIfNotFound: boolean = false) {
    this.logger.debug("Resolving UserId: " + userId);

    const finicityUser = await this.apiClient.getCustomer(userId);

    if (finicityUser) {
      this.logger.trace(`Found existing finicity customer ${finicityUser.id}`);
      return finicityUser.id;
    } else if (failIfNotFound) {
      throw new Error(USER_NOT_RESOLVED_ERROR_TEXT, {
        cause: {
          statusCode: 404,
        },
      });
    }

    this.logger.trace(`Creating finicity user ${userId}`);
    const newCustomer = (await this.apiClient.createCustomer(
      userId,
    )) as Customer;
    return newCustomer.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async HandleOauthResponse(request: any): Promise<Connection> {
    const { connection_id, reason, code } = request?.query || {};
    const { eventType, payload } = request?.body || {};
    let institutionLoginId: string | undefined = undefined;
    let redirect_complete = false;

    const cachedConnection = (await this.cacheClient.get(
      connection_id,
    )) as CachedConnection;

    if (!cachedConnection) {
      return null;
    }

    const { connection, jobTypes } = cachedConnection;

    switch (eventType) {
      case "adding":
        this.performanceClient.recordConnectionResumeEvent(connection_id);
        break;
      case "added":
        institutionLoginId = payload?.accounts?.[0]?.institutionLoginId;
        this.performanceClient.recordSuccessEvent(
          connection_id,
          institutionLoginId,
        );

        if (jobTypes?.includes(ComboJobTypes.TRANSACTION_HISTORY)) {
          await this.apiClient.aggregateTransactionHistory(
            connection.userId,
            institutionLoginId,
          );
        } else if (jobTypes?.includes(ComboJobTypes.TRANSACTIONS)) {
          await this.apiClient.refreshAccountsToAggregateTransactions(
            connection.userId,
          );
        }
        break;
      case "credentialsUpdated":
        connection.status = ConnectionStatus.CONNECTED;
        break;
      case "done":
        return connection;
      case "invalidCredentials":
      case "mfa":
        this.performanceClient.recordConnectionPauseEvent(connection_id);
        break;
      default:
        switch (reason) {
          case "complete":
            connection.status = ConnectionStatus.CONNECTED;
            break;
          case "exit": {
            if (code === "100") {
              connection.status = ConnectionStatus.CLOSED;
            }
            break;
          }
          case "error": {
            // 201 means the widget exited because there wasn't anything to do.
            // If you attempt to fix a connection but it doesn't need fixing then
            // this is the response you get.
            if (code === "201") {
              connection.status = ConnectionStatus.CONNECTED;
            }
            break;
          }
          case "done": {
            redirect_complete = true;
          }
        }
    }
    this.logger.info(
      `Received finicity ${eventType ? "webhook" : "redirect"} response ${connection_id}`,
    );

    if (institutionLoginId) {
      connection.status = ConnectionStatus.CONNECTED;
      connection.id = `${institutionLoginId}`;
      connection.postMessageEventData = {
        memberConnected: {
          ...connection.postMessageEventData?.memberConnected,
          connectionId: `${institutionLoginId}`,
        },
        memberStatusUpdate: {
          ...connection.postMessageEventData?.memberStatusUpdate,
          connectionId: `${institutionLoginId}`,
        },
      };
    }

    await this.cacheClient.set(connection_id, { connection, jobTypes });

    if (redirect_complete) {
      // don't save the status in case if oauth redirect is received before webhook
      connection.status = ConnectionStatus.CONNECTED;
    }

    return connection;
  }
}
