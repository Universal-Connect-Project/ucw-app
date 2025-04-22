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
import type { AdapterConfig } from "./models";
import FinicityClient from "./apiClient";
import { v4 as uuidv4 } from "uuid";

export class FinicityAdapter implements WidgetAdapter {
  aggregator: string;
  apiClient: FinicityClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterConfig) {
    const { sandbox, dependencies } = args;
    this.aggregator = sandbox ? "finicity_sandbox" : "finicity";
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.apiClient = new FinicityClient(
      sandbox,
      dependencies?.aggregatorCredentials,
      this.logger,
      this.envConfig,
      dependencies.getWebhookHostUrl,
    );
  }

  async DeleteUser(userId: string) {
    const resolved = await this.ResolveUserId(userId);
    await this.apiClient.deleteCustomer(resolved);
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    const ins = await this.apiClient.getInstitution(id);
    return {
      id,
      name: ins?.name,
      logo_url: ins?.urlLogonApp,
      url: ins?.urlHomeApp,
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

  ListConnections(_userId: string): Promise<Connection[]> {
    return Promise.resolve([]);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    user_id: string,
  ): Promise<Connection | undefined> {
    const request_id = uuidv4();
    const obj = {
      id: request_id,
      is_oauth: true,
      userId: user_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: await this.apiClient.generateConnectLiteUrl(
        request.institutionId,
        user_id,
        request_id,
      ),
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
    await this.cacheClient.set(request_id, obj);
    return obj;
  }

  async DeleteConnection(id: string): Promise<void> {
    await this.cacheClient.set(id, null);
  }

  async UpdateConnection(
    _request: UpdateConnectionRequest,
  ): Promise<Connection> {
    return null;
  }

  async GetConnectionById(
    connectionId: string,
    _user_id: string,
  ): Promise<Connection> {
    return await this.cacheClient.get(connectionId);
  }

  async GetConnectionStatus(
    connectionId: string,
    _jobId: string,
  ): Promise<Connection> {
    const connection = await this.cacheClient.get(connectionId);

    if (connection.status === ConnectionStatus.CREATED) {
      connection.status = ConnectionStatus.PENDING;
      await this.cacheClient.set(connectionId, connection);
    }
    return connection;
  }

  async AnswerChallenge(
    _request: UpdateConnectionRequest,
    _jobId: string,
  ): Promise<boolean> {
    return true;
  }

  async ResolveUserId(user_id: string, failIfNotFound: boolean = false) {
    this.logger.debug("Resolving UserId: " + user_id);
    const finicityUser = await this.apiClient.getCustomer(user_id);
    if (finicityUser) {
      this.logger.trace(`Found existing finicity customer ${finicityUser.id}`);
      return finicityUser.id;
    } else if (failIfNotFound) {
      throw new Error("User not resolved successfully");
    }

    this.logger.trace(`Creating finicity user ${user_id}`);
    const ret = await this.apiClient.createCustomer(user_id);
    if (ret) {
      return ret.id;
    }
    this.logger.trace(
      `Failed creating finicity user, using user_id: ${user_id}`,
    );
    return user_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async HandleOauthResponse(request: any): Promise<Connection> {
    const { connection_id, reason, code } = request?.query || {};
    const { eventType, payload } = request?.body || {};
    let institutionLoginId = false;
    let error = JSON.stringify(reason || "");
    let redirect_complete = false;
    // eventType comes from webhook events,
    // reason === complete can indicate process end from redirect, however, it lacks of the necessary institutionLoginId information so we don't take that event even if it comes before the webhook
    switch (eventType) {
      case "added":
        institutionLoginId = payload?.accounts?.[0]?.institutionLoginId;
        error = "";
        break;
      default:
        switch (reason) {
          case "error": {
            if (code === "201") {
              // refresh but unnecessary to refresh
              institutionLoginId = connection_id.split(";")[1];
            }
            break;
          }
          case "complete": {
            if (code === "200") {
              error = "";
            }
            redirect_complete = true;
          }
        }
    }
    this.logger.info(
      `Received finicity ${eventType ? "webhook" : "redirect"} response ${connection_id}`,
    );
    const connection = await this.cacheClient.get(connection_id);
    if (!connection) {
      return null;
    }
    if (institutionLoginId) {
      connection.status = ConnectionStatus.CONNECTED;
      connection.raw_status = "CONNECTED";
      connection.guid = connection_id;
      connection.id = `${institutionLoginId}`;
    }
    connection.request_id = connection_id;
    connection.error = error;
    await this.cacheClient.set(connection_id, connection);
    connection.storageClient = this.cacheClient;

    if (redirect_complete) {
      //make sure redirect page displays correct successful message
      //while don't save the status in case if oauth redirect is received before webhook
      connection.status = ConnectionStatus.CONNECTED;
    }
    return connection;
  }
}
