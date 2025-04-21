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
import { ConnectionStatus } from "@repo/utils";
import type { AdapterDependencies, ApiCredentials } from "./models";
import { createGetOauthUrl } from "./apiClient";
import { v4 as uuidv4 } from "uuid";

type AdapterConfig = {
  sandbox: boolean;
  dependencies: AdapterDependencies;
};

export class AkoyaAdapter implements WidgetAdapter {
  aggregator: string;
  credentials: ApiCredentials;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;
  sandbox: boolean;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.sandbox = sandbox;
    this.aggregator = sandbox ? "akoya_sandbox" : "akoya";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.credentials = sandbox
      ? dependencies?.aggregatorCredentials.akoyaSandbox
      : dependencies?.aggregatorCredentials.akoyaProd;
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    return {
      id,
      name: null,
      logo_url: null,
      url: null,
      oauth: true,
      aggregator: this.aggregator,
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
    const obj = {
      id: requestId,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: createGetOauthUrl({
        sandbox: this.sandbox,
        clientId: this.credentials.clientId,
        hostUrl: this.envConfig.HostUrl,
        institutionId: request.institutionId,
        state: requestId,
      }),
      aggregator: this.aggregator,
      status: ConnectionStatus.PENDING,
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

    connection.status = ConnectionStatus.CONNECTED;
    connection.id = connection.institution_code;
    connection.postMessageEventData = {
      memberConnected: {
        akoyaAuthCode: code,
      },
      memberStatusUpdate: {
        akoyaAuthCode: code,
      },
    };

    await this.cacheClient.set(requestId, connection);

    return connection;
  }
}
