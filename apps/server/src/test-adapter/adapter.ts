import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ComboJobTypes, ConnectionStatus } from "@repo/utils";
import { get, set } from "../services/storageClient/redis";
import {
  testExampleCredentials,
  testExampleOauthInstitution,
  testExampleInstitution,
} from "./constants";

export const testJobId = "testJobId";
export const testInstitutionCode = "institutionCode";
export const testConnectionId = "testConnectionId";

const createRedisStatusKey = ({
  aggregator,
  userId,
}: {
  aggregator: string;
  userId: string;
}) => `${aggregator}-${userId}`;

export class TestAdapter implements WidgetAdapter {
  constructor({
    labelText,
    aggregator,
    routeHandlers = {},
    dataRequestValidators = {},
  }: {
    labelText: string;
    aggregator: string;
    routeHandlers?: Record<string, (req: any, res: any) => void>;
    dataRequestValidators?: Record<string, (req: any) => string | undefined>;
  }) {
    this.labelText = labelText;
    this.aggregator = aggregator;
    this.RouteHandlers = routeHandlers;
    this.DataRequestValidators = dataRequestValidators;
  }

  labelText: string;
  aggregator: string;
  RouteHandlers: Record<string, (req: any, res: any) => void> = {};
  DataRequestValidators: Record<string, (req: any) => string | undefined> = {};

  async GetInstitutionById(id: string): Promise<Institution> {
    if (id.toLowerCase().indexOf("oauth") >= 0) {
      if (id.toLowerCase().indexOf("failed") >= 0) {
        return {
          ...testExampleOauthInstitution,
          oauth: true,
          id,
          aggregator: this.aggregator,
        };
      }
      return {
        ...testExampleOauthInstitution,
        oauth: true,
        id,
        aggregator: this.aggregator,
      };
    }
    return {
      ...testExampleInstitution,
      id,
      aggregator: this.aggregator,
    };
  }

  async ListInstitutionCredentials(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    institutionId: string,
  ): Promise<Credential[]> {
    return [
      {
        ...testExampleCredentials,
        label: this.labelText,
      },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ListConnections(userId: string): Promise<Connection[]> {
    return [
      {
        id: testConnectionId,
        cur_job_id: testJobId,
        institution_code: testInstitutionCode,
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator: this.aggregator,
      },
    ];
  }

  async ListConnectionCredentials(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    memberId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<Credential[]> {
    return [
      {
        id: testConnectionId,
        field_name: "testFieldName",
        field_type: "testFieldType",
        label: this.labelText,
      },
    ];
  }

  async CreateConnection(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: CreateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<Connection> {
    const oauth = request.institution_id.toLowerCase().indexOf("oauth") >= 0;
    const failed = request.institution_id.toLowerCase().indexOf("failed") >= 0;
    const oauth_windows_url = `http://localhost:8080/oauth/testExampleA/redirect_from/?code=${failed ? "error" : "success"}&state=test_oauth_connection`;
    if (request.jobTypes?.includes(ComboJobTypes.ACCOUNT_NUMBER)) {
      const redisStatusKey = createRedisStatusKey({
        aggregator: this.aggregator,
        userId,
      });

      await set(redisStatusKey, {
        verifiedOnce: true,
      });
    }

    return {
      id: testConnectionId,
      cur_job_id: testJobId,
      institution_code: testInstitutionCode,
      is_being_aggregated: false,
      is_oauth: oauth,
      oauth_window_uri: oauth ? oauth_windows_url : undefined,
      aggregator: this.aggregator,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async DeleteConnection(id: string, userId: string): Promise<void> {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    return {
      status: 204,
      data: "",
    };
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId: string,
  ): Promise<Connection> {
    const redisStatusKey = createRedisStatusKey({
      aggregator: this.aggregator,
      userId,
    });

    await set(redisStatusKey, null);

    return {
      id: testConnectionId,
      cur_job_id: testJobId,
      institution_code: testInstitutionCode,
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
      aggregator: this.aggregator,
    };
  }

  async GetConnectionById(
    connectionId: string,
    userId: string,
  ): Promise<Connection> {
    return {
      id: testConnectionId,
      institution_code: testInstitutionCode,
      is_oauth: false,
      is_being_aggregated: false,
      oauth_window_uri: undefined,
      aggregator: this.aggregator,
      user_id: userId,
    };
  }

  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    singleAccountSelect: boolean,
    userId: string,
  ): Promise<Connection> {
    const connectionInfo = await get(
      createRedisStatusKey({ aggregator: this.aggregator, userId }),
    );

    if (connectionInfo?.verifiedOnce && singleAccountSelect) {
      return {
        aggregator: this.aggregator,
        id: testConnectionId,
        cur_job_id: testJobId,
        user_id: "testUserId",
        status: ConnectionStatus.CHALLENGED,
        challenges: [
          {
            id: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
            type: 1,
            question: "Please select an account:",
            data: [
              {
                key: "Checking",
                value: "act-23445745",
              },
              {
                key: "Savings",
                value: "act-352386787",
              },
            ],
          },
        ],
      };
    }

    return {
      aggregator: this.aggregator,
      id: testConnectionId,
      cur_job_id: testJobId,
      user_id: userId,
      status: ConnectionStatus.CONNECTED,
      challenges: [],
    };
  }

  async AnswerChallenge(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jobId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<boolean> {
    const redisStatusKey = createRedisStatusKey({
      aggregator: this.aggregator,
      userId,
    });

    await set(redisStatusKey, null);

    return true;
  }

  async ResolveUserId(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    failIfNotFound: boolean = false,
  ): Promise<string> {
    return userId;
  }

  async HandleOauthResponse(request: any): Promise<Connection> {
    const { query } = request;
    if (!query) {
      return null;
    }
    const { state: request_id, code } = query;

    if (code === "error") {
      return {
        status: ConnectionStatus.FAILED,
        request_id: request_id,
        error: code,
      } as any;
    }
    const connection = await get(request_id);
    if (!connection) {
      return null;
    }
    if (code) {
      connection.status = ConnectionStatus.CONNECTED;
      connection.user_id = code;
      connection.request_id = request_id;
    }
    // console.log(connection)
    await set(request_id, connection);

    return connection;
  }
}
