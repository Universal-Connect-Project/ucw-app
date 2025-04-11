import type {
  AggregatorInstitution,
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  KeyValuePair,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { ChallengeType, ComboJobTypes, ConnectionStatus } from "@repo/utils";
import type {
  CredentialRequest,
  CredentialResponse,
  CredentialsResponseBody,
  MemberResponse,
  MxPlatformApiFactory,
} from "mx-platform-node";

import { MxIntApiClient, MxProdApiClient } from "./apiClient";
import type { AdapterConfig, CacheClient, LogClient } from "./models";

const MXJobTypeMap = {
  [ComboJobTypes.ACCOUNT_NUMBER]: "account_verification",
  [ComboJobTypes.ACCOUNT_OWNER]: "identity_verification",
  [ComboJobTypes.TRANSACTIONS]: "transactions",
  [ComboJobTypes.TRANSACTION_HISTORY]: "transaction_history",
};

const convertToMXJobTypes = (jobTypes: ComboJobTypes[]) =>
  jobTypes.map((jobType: ComboJobTypes) => MXJobTypeMap[jobType]);

export const AGGREGATION_JOB_TYPE = 0;

const mapCredentials = (mxCreds: CredentialsResponseBody): Credential[] => {
  if (mxCreds.credentials != null) {
    return mxCreds.credentials.map((item: CredentialResponse) => ({
      id: item.guid || "",
      label: item.label || "",
      field_type: item.field_type || "",
      field_name: item.field_name || "",
    }));
  } else {
    return [];
  }
};

const fromMxMember = (
  member: MemberResponse,
  aggregator: string,
): Connection => {
  return {
    id: member?.guid || null,
    cur_job_id: member.guid,
    // institution_code: entityId, // TODO
    institution_code: member.institution_code, // TODO
    is_being_aggregated: member.is_being_aggregated,
    is_oauth: member.is_oauth,
    oauth_window_uri: member.oauth_window_uri,
    aggregator,
  };
};

export class MxAdapter implements WidgetAdapter {
  aggregator: string;
  apiClient: ReturnType<typeof MxPlatformApiFactory>;
  cacheClient: CacheClient;
  logClient: LogClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterConfig) {
    const { int, dependencies } = args;
    this.aggregator = int ? "mx_int" : "mx";
    this.apiClient = int
      ? MxIntApiClient(dependencies?.aggregatorCredentials.mxInt)
      : MxProdApiClient({
          aggregatorCredentials: dependencies?.aggregatorCredentials.mxProd,
          envConfig: dependencies?.envConfig,
        });
    this.cacheClient = dependencies?.cacheClient;
    this.logClient = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    const res = await this.apiClient.readInstitution(id);
    // TODO: if this is 401 we should throw an error
    const institution = res.data?.institution;
    return {
      id: institution?.code || null,
      oauth: institution?.supports_oauth || false,
      aggregator: this.aggregator,
    };
  }

  async ListInstitutionCredentials(
    institutionId: string,
  ): Promise<Credential[]> {
    const res = await this.apiClient.listInstitutionCredentials(institutionId);
    return mapCredentials(res.data);
  }

  async ListConnections(userId: string): Promise<Connection[]> {
    const res = await this.apiClient.listMembers(userId);

    return (
      res.data.members?.map((member) =>
        fromMxMember(member, this.aggregator),
      ) ?? []
    );
  }

  async ListConnectionCredentials(
    memberId: string,
    userId: string,
  ): Promise<Credential[]> {
    const res = await this.apiClient.listMemberCredentials(memberId, userId);
    return mapCredentials(res.data);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId?: string,
  ): Promise<Connection> {
    const jobTypes = convertToMXJobTypes(request.jobTypes);
    const entityId = request.institutionId;
    try {
      const existings = await this.apiClient.listMembers(userId || "");
      const existing = existings?.data?.members?.find(
        (m) => m.institution_code === entityId,
      );
      if (existing != null) {
        this.logClient.info(
          `Found existing member for institution ${entityId}, deleting`,
        );
        await this.apiClient.deleteMember(existing?.guid || "", userId || "");
      }
    } catch (e) {
      this.logClient.error(e);
    }

    const memberRes = await this.apiClient.createMember(userId || "", {
      referral_source: "APP",
      client_redirect_url: request.is_oauth
        ? `${this.envConfig.HOSTURL}/oauth/${this.aggregator}/redirect_from/`
        : null,
      member: {
        is_oauth: request.is_oauth,
        credentials: request.credentials?.map(
          (c) =>
            ({
              guid: c.id,
              value: c.value,
            }) satisfies CredentialRequest,
        ),
        institution_code: entityId,
      },
      data_request: {
        products: jobTypes,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const member = memberRes.data.member;

    return fromMxMember(member || {}, this.aggregator);
  }

  async DeleteConnection(id: string, userId?: string): Promise<void> {
    await this.apiClient.deleteManagedMember(id, userId || "");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    return await this.apiClient.deleteUser(aggregatorUserId);
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId?: string,
  ): Promise<Connection> {
    const ret = await this.apiClient.updateMember(request.id || "", userId, {
      member: {
        credentials: request.credentials?.map(
          (credential) =>
            ({
              guid: credential.id,
              value: credential.value,
            }) satisfies CredentialRequest,
        ),
      },
    });
    const member = ret.data.member;
    return fromMxMember(member || {}, this.aggregator);
  }

  async GetConnectionById(
    connectionId: string,
    userId?: string,
  ): Promise<Connection> {
    const res = await this.apiClient.readMember(connectionId, userId || "");
    const member = res.data.member;
    return {
      id: member?.guid || "",
      institution_code: member?.institution_code,
      is_oauth: member?.is_oauth,
      is_being_aggregated: member?.is_being_aggregated,
      oauth_window_uri: member?.oauth_window_uri,
      aggregator: this.aggregator,
      userId: userId,
    };
  }

  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    singleAccountSelect?: boolean,
    userId?: string,
  ): Promise<Connection> {
    const res = await this.apiClient.readMemberStatus(memberId, userId || "");
    const member = res.data.member;
    let status = member?.connection_status;
    const oauthStatus = await this.cacheClient.get(member?.guid || "");

    if (oauthStatus?.error != null) {
      status = ConnectionStatus[ConnectionStatus.REJECTED];
    }

    return {
      aggregator: this.aggregator,
      id: member?.guid || "",
      cur_job_id: member?.guid,
      userId: userId,
      status: ConnectionStatus[status as keyof typeof ConnectionStatus],
      challenges: (member?.challenges ?? []).map((item, idx) => {
        const challenge: Challenge = {
          id: item.guid ?? `${idx}`,
          type: ChallengeType.QUESTION,
          question: item.label,
        };
        switch (item.type) {
          case "TEXT":
            challenge.type = ChallengeType.QUESTION;
            challenge.data = [{ key: `${idx}`, value: item.label }];
            break;
          case "OPTIONS":
            challenge.type = ChallengeType.OPTIONS;
            challenge.question = item.label;
            challenge.data = (item.options ?? []).map((o) => ({
              key: o.label ?? o.value,
              value: o.value,
            })) as KeyValuePair[];
            break;
          case "TOKEN":
            challenge.type = ChallengeType.TOKEN;
            challenge.data = item.label!;
            break;
          case "IMAGE_DATA":
            challenge.type = ChallengeType.IMAGE;
            challenge.data = item.image_data!;
            break;
          case "IMAGE_OPTIONS":
            challenge.type = ChallengeType.IMAGE_OPTIONS;
            challenge.data = (item.image_options ?? []).map((io) => ({
              key: io.label ?? io.value,
              value: io.data_uri ?? io.value,
            })) as KeyValuePair[];
            break;
          default:
            break; // todo?
        }
        return challenge;
      }),
    };
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string,
    userId?: string,
  ): Promise<boolean> {
    await this.apiClient.resumeAggregation(request.id || "", userId || "", {
      member: {
        challenges: request.challenges?.map((item, idx) => ({
          guid: item.id ?? `${idx}`,
          value: item.response as string,
        })),
      },
    });
    return true;
  }

  async ResolveUserId(
    userId: string,
    failIfNotFound: boolean = false,
  ): Promise<string> {
    this.logClient.debug("Resolving UserId: " + userId);

    let ret;
    const res = await this.apiClient.listUsers(1, 10, userId);
    const mxUser = res.data?.users?.find((u) => u.id === userId);

    if (mxUser != null) {
      this.logClient.trace(`Found existing mx user ${mxUser.guid}`);
      return mxUser.guid || "";
    } else if (failIfNotFound) {
      throw new Error("User not resolved successfully");
    }

    this.logClient.trace(`Creating mx user ${userId}`);

    try {
      ret = await this.apiClient.createUser({
        user: { id: userId },
      });

      if (ret?.data?.user != null) {
        return ret.data.user.guid || "";
      }
    } catch (e) {
      this.logClient.trace(`Failed creating mx user, using userId: ${userId}`);
      return userId;
    }

    return userId;
  }

  async HandleOauthResponse({
    query,
  }: {
    query: Record<string, string>;
  }): Promise<Connection> {
    const { status } = query;

    if (status === "success") {
      return {
        status: ConnectionStatus.CONNECTED,
      } as Connection;
    }

    return {
      status: ConnectionStatus.DENIED,
    } as Connection;
  }
}
