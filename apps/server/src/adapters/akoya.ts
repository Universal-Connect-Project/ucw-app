import * as logger from "../infra/logger";
import AkoyaClient from "../aggregatorApiClients/akoya";
import aggregatorCredentials from "../aggregatorCredentials";
import { get, set } from "../services/storageClient/redis";
import {
  type Connection,
  ConnectionStatus,
  type CreateConnectionRequest,
  type Credential,
  type Institution,
  type UpdateConnectionRequest,
  type WidgetAdapter,
} from "@repo/utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require("uuid");

export class AkoyaAdapter implements WidgetAdapter {
  sandbox: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiClient: any;
  token: string;
  constructor(sandbox: boolean) {
    this.token = "thisNeverWorked";
    this.sandbox = sandbox;
    this.apiClient = new AkoyaClient(
      sandbox
        ? aggregatorCredentials.akoyaSandbox
        : aggregatorCredentials.akoyaProd,
    );
  }

  async GetInstitutionById(id: string): Promise<Institution> {
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
  ): Promise<Connection | undefined> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const request_id = `${this.token}${uuidv4().replaceAll("-", "")}`;
    const obj = {
      id: request_id,
      is_oauth: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institution_id,
      oauth_window_uri: this.apiClient.getOauthUrl(
        request.institution_id,
        this.apiClient.client_redirect_url,
        request_id,
      ),
      aggregator: this.apiClient.apiConfig.aggregator,
      status: ConnectionStatus.PENDING,
    };
    await set(request_id, obj);
    return obj;
  }

  async DeleteConnection(id: string): Promise<void> {
    await set(id, null);

    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    throw new Error("Not Implemented");
  }

  async UpdateConnection(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
  ): Promise<Connection> {
    return null;
  }

  async GetConnectionById(connectionId: string): Promise<Connection> {
    return await get(connectionId);
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
    return await get(connectionId);
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
  async ResolveUserId(user_id: string) {
    return user_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async HandleOauthResponse(request: any): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { state: request_id, code } = request;
    logger.info(`Received akoya oauth redirect response ${request_id}`);
    const connection = await get(request_id);
    if (!connection) {
      return null;
    }
    if (code) {
      connection.status = ConnectionStatus.CONNECTED;
      connection.guid = connection.institution_code;
      connection.id = connection.institution_code;
      connection.user_id = code;
      connection.request_id = request_id;
    }
    // console.log(connection)
    await set(request_id, connection);

    return connection;
  }
}
