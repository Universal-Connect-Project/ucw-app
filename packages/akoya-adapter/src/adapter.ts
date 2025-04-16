import type {
  AggregatorInstitution,
  Connection,
  CreateConnectionRequest,
  Credential,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ConnectionStatus } from "@repo/utils";
import type { AdapterConfig, CacheClient, LogClient } from "./models";
import AkoyaClient from "./apiClient";
import { v4 as uuidv4 } from "uuid";

export class AkoyaAdapter implements WidgetAdapter {
  aggregator: string;
  apiClient: AkoyaClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.aggregator = sandbox ? "akoya_sandbox" : "akoya";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    const credentials = sandbox
      ? dependencies?.aggregatorCredentials.akoyaSandbox
      : dependencies?.aggregatorCredentials.akoyaProd;

    this.apiClient = new AkoyaClient(
      sandbox,
      credentials,
      this.logger,
      this.envConfig,
    );
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    return Promise.resolve({
      id,
      name: null,
      logo_url: null,
      url: null,
      oauth: true,
      aggregator: this.apiClient.apiConfig.aggregator,
    });
  }

  async ListInstitutionCredentials(_id: string): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  async ListConnectionCredentials(
    _connectionId: string,
    _userId: string,
  ): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  async ListConnections(_userId: string): Promise<Connection[]> {
    return Promise.resolve([]);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string,
  ): Promise<Connection | undefined> {
    const requestId = uuidv4();
    const obj = {
      id: requestId,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: this.apiClient.getOauthUrl(
        request.institutionId,
        requestId,
      ),
      aggregator: this.apiClient.apiConfig.aggregator,
      status: ConnectionStatus.PENDING,
      raw_status: "PENDING",
    };
    await this.cacheClient.set(requestId, obj, {
      EX: 600, // 10 minutes
    });
    this.logger.debug(
      `akoya adapter creating member with url ${obj.oauth_window_uri}`,
    );
    return obj;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async DeleteConnection(id: string, userId: string): Promise<void> {
    await this.cacheClient.set(id, null);

    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
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
    return (await this.cacheClient.get(connectionId)) as Connection;
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
    const { state: requestId, code } = request?.query || {};
    this.logger.trace(`Received akoya oauth redirect response ${requestId}`);
    const connection = (await this.cacheClient.get(requestId)) as Connection;
    if (!connection) {
      throw new Error("Connection failed");
    }

    if (!code) {
      connection.status = ConnectionStatus.DENIED;
      await this.cacheClient.set(requestId, connection);
      return connection;
    }

    const token = code;
    connection.status = ConnectionStatus.CONNECTED;
    connection.id = connection.institution_code;
    connection.userId = token;

    await this.cacheClient.set(requestId, connection);

    return connection;
  }
}
