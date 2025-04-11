import type {
  AggregatorInstitution,
  Connection,
  CreateConnectionRequest,
  Credential,
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
import config from "../config";

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
    dataRequestValidators = {},
  }: {
    labelText: string;
    aggregator: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataRequestValidators?: Record<string, (req: any) => string | undefined>;
  }) {
    this.labelText = labelText;
    this.aggregator = aggregator;
    this.DataRequestValidators = dataRequestValidators;
  }

  labelText: string;
  aggregator: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DataRequestValidators: Record<string, (req: any) => string | undefined> = {};

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
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
    const oauth = request.institutionId?.toLowerCase().includes("oauth");
    const failed = request.institutionId?.toLowerCase().includes("failed");
    const oauth_windows_url = `${config.HOST_URL}/oauth/${this.aggregator}/redirect_from/?code=${failed ? "error" : "success"}`;

    const redisStatusKey = createRedisStatusKey({
      aggregator: this.aggregator,
      userId,
    });

    await set(redisStatusKey, null);

    if (failed) {
      await set(redisStatusKey, {
        shouldReturnError: true,
      });
    }

    if (
      request.jobTypes?.includes(ComboJobTypes.ACCOUNT_NUMBER) &&
      !request.is_oauth
    ) {
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
      userId: userId,
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

    if (connectionInfo?.shouldReturnError) {
      return {
        aggregator: this.aggregator,
        id: testConnectionId,
        cur_job_id: testJobId,
        userId: userId,
        status: ConnectionStatus.DENIED,
        challenges: [],
      };
    }

    if (connectionInfo?.verifiedOnce && singleAccountSelect) {
      return {
        aggregator: this.aggregator,
        id: testConnectionId,
        cur_job_id: testJobId,
        userId: "testUserId",
        status: ConnectionStatus.CHALLENGED,
        raw_status: 'raw_status',
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
      userId: userId,
      status: ConnectionStatus.CONNECTED,
      raw_status: 'raw_status',
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

  async HandleOauthResponse({
    query,
  }: {
    query: Record<string, string>;
  }): Promise<Connection> {
    const { state: request_id, code } = query;
    if (code === "error") {
      return {
        status: ConnectionStatus.DENIED,
        raw_status: 'raw_status',
        id: request_id,
        error: code,
      } as Connection
    }
    return {
      status: ConnectionStatus.CONNECTED,
      raw_status: 'raw_status',
      userId: code,
      id: request_id
    }
  }
}
