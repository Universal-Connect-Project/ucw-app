import type {
  AggregatorInstitution,
  Connection,
  CreateConnectionRequest,
  Credential,
  UpdateConnectionRequest,
  WidgetAdapter
} from "@repo/utils";
import {ConnectionStatus} from "@repo/utils";
import type { AdapterConfig, CacheClient, LogClient } from "./models";
import AkoyaClient from './apiClient';
import { v4 as uuidv4 } from 'uuid';

export class AkoyaAdapter implements WidgetAdapter {
  sessionId: string;
  aggregator: string;
  apiClient: AkoyaClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterConfig) {
    const {sandbox, sessionId, dependencies} = args;
    this.aggregator = sandbox ? "akoya_sandbox" : "akoya";
    this.sessionId = sessionId || 'session';
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.apiClient = sandbox
      ? new AkoyaClient(sandbox, dependencies?.aggregatorCredentials.akoyaSandbox, this.logger, this.envConfig)
      : new AkoyaClient(sandbox, dependencies?.aggregatorCredentials.akoyaProd, this.logger, this.envConfig);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ListInstitutionCredentials(id: string): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  async ListConnectionCredentials(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    connectionId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ListConnections(userId: string): Promise<Connection[]> {
    return Promise.resolve([]);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    user_id: string
  ): Promise<Connection | undefined> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const request_id = `${this.sessionId}${uuidv4().replaceAll("-", "")}`;
    const obj = {
      id: request_id,
      is_oauth: true,
      userId: user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: this.apiClient.getOauthUrl(
        request.institutionId,
        request_id,
      ),
      aggregator: this.apiClient.apiConfig.aggregator,
      status: ConnectionStatus.CREATED,
      raw_status: 'PENDING',
    };
    await this.cacheClient.set(request_id, obj);
    this.logger.debug(`akoya adapter creating member with url ${obj.oauth_window_uri}`)
    return obj;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async DeleteConnection(id: string, user_id: string): Promise<void> {
    await this.cacheClient.set(id, null);

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    return null;
  }

  async UpdateConnection(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user_id: string
  ): Promise<Connection> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async GetConnectionById(connectionId: string, user_id: string): Promise<Connection> {
    return await this.cacheClient.get(connectionId);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async GetConnectionStatus(
    connectionId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jobId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    single_account_select?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user_id?: string,
  ): Promise<Connection> {
    const connection = await this.cacheClient.get(connectionId);
    if(connection.status === ConnectionStatus.CREATED){
      connection.status = ConnectionStatus.PENDING;
    }
    await this.cacheClient.set(connectionId, connection);
    return connection;
  }

  async AnswerChallenge(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jobId: string,
  ): Promise<boolean> {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async ResolveUserId(user_id: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    failIfNotFound: boolean = false
  ) {
    return user_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async HandleOauthResponse(request: any): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { state: request_id, code } = request?.query || {};
    this.logger.trace(`Received akoya oauth redirect response ${request_id}`);
    const connection = await this.cacheClient.get(request_id);
    if (!connection) {
      return null;
    }
    if (code) {
      const token = code
      connection.status = ConnectionStatus.CONNECTED;
      connection.guid = connection.institution_code;
      connection.id = connection.institution_code;
      connection.userId = token;
      connection.request_id = request_id;
    }
  
    await this.cacheClient.set(request_id, connection);

    return connection;
  }
}