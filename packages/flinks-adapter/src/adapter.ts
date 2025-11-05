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
import type { AdapterConfig } from "./models";
import FlinksClient from "./apiClient";

interface CachedConnection {
  connection?: Connection;
  jobTypes?: ComboJobTypes[];
}

export class FlinksAdapter implements WidgetAdapter {
  aggregator: string;
  aggregatorDisplayName = "Flinks";
  apiClient: FlinksClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;
  performanceClient: PerformanceClient;
  requiresPollingForPerformance = false;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.aggregator = sandbox ? "flinks_sandbox" : "flinks";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.apiClient = new FlinksClient(
      sandbox,
      dependencies?.aggregatorCredentials,
      this.logger,
      this.envConfig,
      this.cacheClient,
    );
  }

  async DeleteUser(userId: string) {
    
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
    const connectionId = request.id;
    let oauthWindowUri: string;
    oauthWindowUri = await this.apiClient.getConnectUrl(
      connectionId || connectSessionId,
      request.institutionId == '14'
    );

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
    return userId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async HandleOauthResponse(request: any): Promise<Connection> {
    const { connection_id, demo, loginId, institution } = request?.query || {};
    const cachedConnection = (await this.cacheClient.get(
      connection_id,
    )) as CachedConnection;

    if (!cachedConnection) {
      return null;
    }
    const { connection, jobTypes } = cachedConnection;
    this.logger.info(
      `Received flinks redirect response ${connection_id}`,
    );

    if (loginId) {
      connection.status = ConnectionStatus.CONNECTED;
      connection.id = `${loginId}`;
      connection.postMessageEventData = {
        memberConnected: {
          ...connection.postMessageEventData?.memberConnected,
          connectionId: `${loginId}`,
        },
        memberStatusUpdate: {
          ...connection.postMessageEventData?.memberStatusUpdate,
          connectionId: `${loginId}`,
        },
      };
      connection.status = ConnectionStatus.CONNECTED;
    }
    await this.cacheClient.set(connection_id, { connection, jobTypes });
    return connection;
  }
}
