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
import {
  ComboJobTypes,
  ConnectionStatus,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";
import type { AdapterConfig, Customer } from "./models";
import FinicityClient from "./apiClient";
import { v4 as uuidv4 } from "uuid";

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
    const request_id = uuidv4();
    const connection = {
      id: request_id,
      is_oauth: true,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: await this.apiClient.generateConnectLiteUrl(
        request.institutionId,
        userId,
        request_id,
      ),
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
    await this.cacheClient.set(request_id, {
      connection,
      jobTypes: request.jobTypes,
    });
    return connection;
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
    _user_id?: string,
  ): Promise<Connection> {
    const cachedConnection = (await this.cacheClient.get(
      connectionId,
    )) as CachedConnection;
    return cachedConnection?.connection;
  }

  async GetConnectionStatus(
    connectionId: string,
    _jobId?: string,
  ): Promise<Connection> {
    const cachedConnection = (await this.cacheClient.get(
      connectionId,
    )) as CachedConnection;

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
    console.log("about to request user");

    const finicityUser = await this.apiClient.getCustomer(userId);

    console.log({ finicityUser });

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
    let institutionLoginId = false;
    let redirect_complete = false;

    const cachedConnection = (await this.cacheClient.get(
      connection_id,
    )) as CachedConnection;

    if (!cachedConnection) {
      return null;
    }

    const { connection, jobTypes } = cachedConnection;

    switch (eventType) {
      case "added":
        institutionLoginId = payload?.accounts?.[0]?.institutionLoginId;

        if (jobTypes?.includes(ComboJobTypes.TRANSACTIONS)) {
          await this.apiClient.refreshAccountsToAggregateTransactions(
            connection.userId,
          );
        }
        break;
      default:
        switch (reason) {
          case "exit": {
            if (code === "100") {
              connection.status = ConnectionStatus.CLOSED;
            }
            break;
          }
          case "error": {
            if (code === "201") {
              connection.status = ConnectionStatus.FAILED;
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
