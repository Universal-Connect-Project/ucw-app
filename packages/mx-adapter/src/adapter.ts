import type {
  CredentialRequest,
  CredentialResponse,
  CredentialsResponseBody,
  MemberResponse,
  MxPlatformApiFactory
} from "mx-platform-node";

import {MxIntApiClient, MxProdApiClient} from "./apiClient";
import type {
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution, KeyValuePair,
  UpdateConnectionRequest,
  WidgetAdapter
} from "./contract";
import {ChallengeType, ConnectionStatus} from "./contract";
import type {AdapterConfig, CacheClient, LogClient} from "./models";

export const EXTENDED_HISTORY_NOT_SUPPORTED_MSG =
  "Member's institution does not support extended transaction history.";
export let cacheClient: CacheClient;
export let logClient: LogClient;
export let aggregatorCredentials: any;
export let envConfig: any;

const mapCredentials = (mxCreds: CredentialsResponseBody): Credential[] => {
  if (mxCreds.credentials != null) {
    return mxCreds.credentials.map((item: CredentialResponse) => ({
      id: item.guid || '',
      label: item.field_name || '',
      field_type: item.field_type || '',
      field_name: item.field_name || ''
    }));
  } else {
    return [];
  }
};

const fromMxMember = (member: MemberResponse, aggregator: string): Connection => {
  return {
    id: member?.guid || null,
    cur_job_id: member.guid,
    // institution_code: entityId, // TODO
    institution_code: member.institution_code, // TODO
    is_being_aggregated: member.is_being_aggregated,
    is_oauth: member.is_oauth,
    oauth_window_uri: member.oauth_window_uri,
    aggregator
  };
};

export class MxAdapter implements WidgetAdapter {
  aggregator: string;
  apiClient: ReturnType<typeof MxPlatformApiFactory>;

  constructor(args: AdapterConfig) {
    const {int, dependencies} = args;
    this.aggregator = int ? "mx_int" : "mx";
    this.apiClient = int
      ? MxIntApiClient(dependencies?.aggregatorCredentials.mxInt)
      : MxProdApiClient(dependencies?.aggregatorCredentials.mxProd);
    cacheClient = dependencies?.cacheClient;
    logClient = dependencies?.logClient;
    aggregatorCredentials = dependencies?.aggregatorCredentials;
    envConfig = dependencies?.envConfig;
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    const res = await this.apiClient.readInstitution(id);
    // TODO: if this is 401 we should throw an error
    const institution = res.data?.institution;
    return {
      id: institution?.code || null,
      logo_url: institution?.medium_logo_url ?? institution?.small_logo_url ?? null,
      name: institution?.name || '',
      oauth: institution?.supports_oauth || false,
      url: institution?.url || '',
      aggregator: this.aggregator
    };
  }

  async ListInstitutionCredentials(
    institutionId: string
  ): Promise<Credential[]> {
    const res = await this.apiClient.listInstitutionCredentials(institutionId);
    return mapCredentials(res.data);
  }

  async ListConnections(userId: string): Promise<Connection[]> {
    const res = await this.apiClient.listMembers(userId);

    return (
      res.data.members?.map((member) => fromMxMember(member, this.aggregator)) ??
      []
    );
  }

  async ListConnectionCredentials(
    memberId: string,
    userId: string
  ): Promise<Credential[]> {
    const res = await this.apiClient.listMemberCredentials(memberId, userId);
    return mapCredentials(res.data);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId?: string
  ): Promise<Connection> {
    const jobType = request.initial_job_type;
    const entityId = request.institution_id;
    const existings = await this.apiClient.listMembers(userId || '');
    const existing = existings?.data?.members?.find(
      (m) => m.institution_code === entityId
    );
    if (existing != null) {
      logClient.info(`Found existing member for institution ${entityId}, deleting`);
      await this.apiClient.deleteMember(existing?.guid || '', userId || '');
    }
    // let res = await this.apiClient.listInstitutionCredentials(entityId)
    // console.log(request)
    const memberRes = await this.apiClient.createMember(userId || '', {
      referral_source: "APP", // request.is_oauth ? 'APP' : '',
      client_redirect_url: request.is_oauth
        ? `${envConfig.HostUrl}/oauth_redirect`
        : null,
      member: {
        skip_aggregation: request.skip_aggregation || jobType !== "aggregate",
        is_oauth: request.is_oauth,
        credentials: request.credentials?.map(
          (c) =>
            ({
              guid: c.id,
              value: c.value
            }) satisfies CredentialRequest
        ),
        institution_code: entityId
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const member = memberRes.data.member;

    if (!request?.is_oauth) {
      if (
        ["verification", "aggregate_identity_verification"].includes(jobType || "")
      ) {
        const updatedMemberRes = await this.apiClient.verifyMember(
          member?.guid || '',
          userId || ''
        );
        return fromMxMember(updatedMemberRes?.data?.member || {}, this.aggregator);
      } else if (jobType === "aggregate_identity") {
        const updatedMemberRes = await this.apiClient.identifyMember(
          member?.guid || '',
          userId || ''
        );
        return fromMxMember(updatedMemberRes?.data?.member || {}, this.aggregator);
      } else if (jobType === "aggregate_extendedhistory") {
        const updatedMemberRes = await this.apiClient.extendHistory(
          member?.guid || '',
          userId || ''
        );
        return fromMxMember(updatedMemberRes?.data?.member || {}, this.aggregator);
      }
    }

    return fromMxMember(member || {}, this.aggregator);
  }

  async DeleteConnection(id: string, userId?: string): Promise<void> {
    await this.apiClient.deleteManagedMember(id, userId || '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    return await this.apiClient.deleteUser(aggregatorUserId);
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId?: string
  ): Promise<Connection> {
    let ret;

    try {
      if (request.job_type === "verification") {
        ret = await this.apiClient.verifyMember(request.id || '', userId || '');
      } else if (request.job_type === "aggregate_identity") {
        ret = await this.apiClient.identifyMember(request.id || '', userId || '', {
          data: {member: {include_transactions: true}}
        });
      } else if (request.job_type === "aggregate_extendedhistory") {
        ret = await this.apiClient.extendHistory(request.id || '', userId || '');
      } else {
        ret = await this.apiClient.aggregateMember(request.id || '', userId || '');
      }
    } catch (e: any) {
      if (e?.response?.data?.error?.message === EXTENDED_HISTORY_NOT_SUPPORTED_MSG) {
        try {
          ret = await this.apiClient.aggregateMember(request.id || '', userId || '');
        } catch (e: any) {
          return {id: request.id || '', error_message: e?.response?.data?.error?.message};
        }
      } else {
        return {id: request.id || '', error_message: e?.response?.data?.error?.message};
      }
    }

    return fromMxMember(ret.data.member || {}, this.aggregator);
  }

  async UpdateConnectionInternal(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    const ret = await this.apiClient.updateMember(request.id || '', userId, {
      member: {
        credentials: request.credentials?.map(
          (credential) =>
            ({
              guid: credential.id,
              value: credential.value
            }) satisfies CredentialRequest
        )
      }
    });
    const member = ret.data.member;
    return fromMxMember(member || {}, this.aggregator);
  }

  async GetConnectionById(
    connectionId: string,
    userId?: string
  ): Promise<Connection> {
    const res = await this.apiClient.readMember(connectionId, userId || '');
    const member = res.data.member;
    return {
      id: member?.guid || '',
      institution_code: member?.institution_code,
      is_oauth: member?.is_oauth,
      is_being_aggregated: member?.is_being_aggregated,
      oauth_window_uri: member?.oauth_window_uri,
      aggregator: this.aggregator,
      user_id: userId
    };
  }

  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    singleAccountSelect?: boolean,
    userId?: string
  ): Promise<Connection> {
    const res = await this.apiClient.readMemberStatus(memberId, userId || '');
    const member = res.data.member;
    let status = member?.connection_status;
    const oauthStatus = await cacheClient.get(member?.guid || '');

    if (oauthStatus?.error != null) {
      status = ConnectionStatus[ConnectionStatus.REJECTED];
    }

    return {
      aggregator: this.aggregator,
      id: member?.guid || '',
      cur_job_id: member?.guid,
      user_id: userId,
      // is_oauth: member.is_oauth,
      // oauth_window_uri: member.oauth_window_uri,
      // status: member.connection_status,
      // error_reason: oauthStatus?.error_reason,
      status: ConnectionStatus[status as keyof typeof ConnectionStatus],
      challenges: (member?.challenges ?? []).map((item, idx) => {
        const challenge: Challenge = {
          id: item.guid ?? `${idx}`,
          type: ChallengeType.QUESTION,
          question: item.label
        };
        switch (item.type) {
          case "TEXT":
            challenge.type = ChallengeType.QUESTION;
            challenge.data = [{key: `${idx}`, value: item.label}];
            break;
          case "OPTIONS":
            challenge.type = ChallengeType.OPTIONS;
            challenge.question = item.label;
            challenge.data = (item.options ?? []).map((o) => ({
              key: o.label ?? o.value,
              value: o.value
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
              value: io.data_uri ?? io.value
            })) as KeyValuePair[];
            break;
          default:
            break; // todo?
        }
        return challenge;
      })
    };
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string,
    userId?: string
  ): Promise<boolean> {
    await this.apiClient.resumeAggregation(request.id || '', userId || '', {
      member: {
        challenges: request.challenges?.map((item, idx) => ({
          guid: item.id ?? `${idx}`,
          value: item.response as string
        }))
      }
    });
    return true;
  }

  async ResolveUserId(
    userId: string,
    failIfNotFound: boolean = false
  ): Promise<string> {
    logClient.debug("Resolving UserId: " + userId);

    let ret;
    const res = await this.apiClient.listUsers(1, 10, userId);
    const mxUser = res.data?.users?.find((u) => u.id === userId);

    if (mxUser != null) {
      logClient.trace(`Found existing mx user ${mxUser.guid}`);
      return mxUser.guid || "";
    } else if (failIfNotFound) {
      throw new Error("User not resolved successfully");
    }

    logClient.trace(`Creating mx user ${userId}`);

    try {
      ret = await this.apiClient.createUser({
        user: {id: userId}
      });

      if (ret?.data?.user != null) {
        return ret.data.user.guid || "";
      }
    } catch (e) {
      logClient.trace(`Failed creating mx user, using user_id: ${userId}`);
      return userId;
    }

    return userId;
  }
}
