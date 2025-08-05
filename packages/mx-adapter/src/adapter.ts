import type {
  AggregatorInstitution,
  ApiResponse,
  CacheClient,
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  KeyValuePair,
  LogClient,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import {
  ChallengeType,
  ComboJobTypes,
  ConnectionStatus,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";
import type {
  CredentialRequest,
  CredentialResponse,
  CredentialsResponseBody,
  MemberResponse,
  MxPlatformApiFactory,
} from "mx-platform-node";

import { MxIntApiClient, MxProdApiClient } from "./apiClient";
import type { AdapterConfig } from "./models";

const MXJobTypeMap = {
  [ComboJobTypes.ACCOUNT_NUMBER]: "account_verification",
  [ComboJobTypes.ACCOUNT_OWNER]: "identity_verification",
  [ComboJobTypes.TRANSACTIONS]: "transactions",
  [ComboJobTypes.TRANSACTION_HISTORY]: "transaction_history",
};

const convertToMXJobTypes = (jobTypes: ComboJobTypes[]) =>
  jobTypes.map((jobType: ComboJobTypes) => MXJobTypeMap[jobType]);

export const AGGREGATION_JOB_TYPE = 0;
export const DUPLICATE_MEMBER_CREATION_ATTEMPTED_ERROR_CODE = 409;

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
    const institution = res.data?.institution;
    return {
      id: institution?.code || null,
      aggregator: this.aggregator,
      supportsOauth: institution.supports_oauth || false,
      aggregatorLogoUrl: "/mx-logo.png", // TODO: Replace with actual logo URL
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

  #GetNewMemberPropertiesFromRequest(request: CreateConnectionRequest) {
    const jobTypes = convertToMXJobTypes(request.jobTypes);

    return {
      referral_source: "APP",
      client_redirect_url: request.is_oauth
        ? `${this.envConfig.HOSTURL}/oauth/${this.aggregator}/redirect_from/`
        : null,
      member: {
        is_oauth: request.is_oauth,
        credentials: request.credentials?.map(
          (c) => ({ guid: c.id, value: c.value }) satisfies CredentialRequest,
        ),
        institution_code: request.institutionId,
      },
      data_request: { products: jobTypes },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  async #GetOauthRefreshConnection(
    userGuid: string,
    connectionId: string,
  ): Promise<Connection> {
    const request = await this.apiClient.requestOAuthWindowURI(
      connectionId,
      userGuid,
      `${this.envConfig.HOSTURL}/oauth/${this.aggregator}/redirect_from/`,
    );

    return {
      id: connectionId,
      is_oauth: true,
      userId: userGuid,
      oauth_window_uri: request.data.member.oauth_window_uri,
      aggregator: this.aggregator,
      status: ConnectionStatus.CREATED,
    };
  }

  async #CreateOrUpdateExistingInstitutionConnection(
    userId: string,
    memberGuid: string,
    newMemberProperties: any,
  ): Promise<Connection> {
    try {
      const newMemberRes = await this.apiClient.createMember(
        userId || "",
        newMemberProperties,
      );
      return fromMxMember(newMemberRes.data.member, this.aggregator);
    } catch (error) {
      if (
        error?.response?.status ===
        DUPLICATE_MEMBER_CREATION_ATTEMPTED_ERROR_CODE
      ) {
        return this.UpdateConnection(
          {
            id: memberGuid,
            credentials: newMemberProperties.member.credentials,
          },
          userId,
        );
      }
      this.logClient.error(error);
      throw new Error(error.message);
    }
  }

  async #GetExistingMemberIfExists(
    userId: string,
    institutionCode: string,
  ): Promise<MemberResponse | undefined> {
    const existingMembersPerUserId = await this.apiClient.listMembers(
      userId || "",
    );
    return existingMembersPerUserId?.data?.members?.find(
      (m) => m.institution_code === institutionCode,
    );
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId?: string,
  ): Promise<Connection> {
    const connectionId = request.id;

    if (connectionId && userId) {
      // Refreshing non-oauth connections don't go through `CreateConnection`
      return this.#GetOauthRefreshConnection(userId, connectionId);
    }

    const institutionCode = request.institutionId;

    const newMemberProperties =
      this.#GetNewMemberPropertiesFromRequest(request);

    try {
      const existingMember = await this.#GetExistingMemberIfExists(
        userId,
        institutionCode,
      );

      if (existingMember?.is_oauth) {
        // We're not allowing multiple oauth connections per user/institution.
        // MX Api is limiting us from having that feature.
        return this.#GetOauthRefreshConnection(userId, existingMember.guid);
      } else if (existingMember) {
        return this.#CreateOrUpdateExistingInstitutionConnection(
          userId,
          existingMember.guid,
          newMemberProperties,
        );
      }
    } catch (e) {
      this.logClient.error(e);
    }

    const newMemberRes = await this.apiClient.createMember(
      userId || "",
      newMemberProperties,
    );

    const member = newMemberRes.data.member;

    return fromMxMember(member || {}, this.aggregator);
  }

  async DeleteConnection(
    memberGuid: string,
    userId: string,
  ): Promise<ApiResponse> {
    return await this.apiClient.deleteMember(memberGuid, userId);
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
              guid: credential.guid || credential.id,
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
      throw new Error(USER_NOT_RESOLVED_ERROR_TEXT);
    }

    this.logClient.trace(`Creating mx user ${userId}`);

    try {
      ret = await this.apiClient.createUser({ user: { id: userId } });

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
      return { status: ConnectionStatus.CONNECTED } as Connection;
    }

    return { status: ConnectionStatus.DENIED } as Connection;
  }
}
