import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ConnectionStatus, MappedJobTypes } from "@repo/utils";
import { get, set } from "../services/storageClient/redis";
import { testExampleCredentials, testExampleInstitution } from "./constants";

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
        id: "testId",
        cur_job_id: "testJobId",
        institution_code: "testCode",
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
        id: "testId",
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
    return {
      id: "testId",
      cur_job_id: "testJobId",
      institution_code: "testCode",
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
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

    const connectionInfo = await get(redisStatusKey);

    if (
      !connectionInfo?.verifiedOnce &&
      request.job_type === MappedJobTypes.VERIFICATION
    ) {
      await set(redisStatusKey, {
        verifiedOnce: true,
      });
    } else {
      await set(redisStatusKey, null);
    }

    return {
      id: "testId",
      cur_job_id: "testJobId",
      institution_code: "testCode",
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
      aggregator: this.aggregator,
    };
  }

  async UpdateConnectionInternal(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<Connection> {
    return {
      id: "testId",
      cur_job_id: "testJobId",
      institution_code: "testCode",
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
      id: "testId",
      institution_code: "testCode",
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
        id: "testId",
        cur_job_id: "testJobId",
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
      id: "testId",
      cur_job_id: "testJobId",
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
    return true;
  }

  async ResolveUserId(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    failIfNotFound: boolean = false,
  ): Promise<string> {
    return userId;
  }
}
