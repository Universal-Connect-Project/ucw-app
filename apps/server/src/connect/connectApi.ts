import * as logger from "../infra/logger";
import type { Challenge, Connection } from "@repo/utils";
import { ChallengeType, ConnectionStatus } from "@repo/utils";

import { AggregatorAdapterBase } from "../adapters";
import type {
  Member,
  MemberResponse,
  Credential,
} from "../shared/connect/contract";
import {
  recordConnectionPauseEvent,
  recordConnectionResumeEvent,
  recordStartEvent,
  recordSuccessEvent,
} from "../services/performanceTracking";
import { getAggregatorIdFromTestAggregatorId } from "../adapterIndex";
import {
  createPerformancePollingObject,
  setLastUiUpdateTimestamp,
} from "../aggregatorPerformanceMeasuring/utils";

function mapConnection(connection: Connection): Member {
  const userId = connection.userId;
  const memberGuid = connection.id;
  const connectionStatus = connection.status ?? ConnectionStatus.CREATED;

  const sharedEventData = {
    aggregator: connection.aggregator,
    member_guid: memberGuid,
    user_guid: userId,
  };

  return {
    institution_guid: connection.institution_code,
    guid: memberGuid,
    connection_status: connectionStatus,
    most_recent_job_guid:
      connection.status === ConnectionStatus.CONNECTED
        ? connection.cur_job_id
        : null,
    is_oauth: connection.is_oauth,
    oauth_window_uri: connection.oauth_window_uri,
    aggregator: connection.aggregator,
    postMessageEventData: {
      memberConnected: {
        ...(connection.postMessageEventData?.memberConnected || {}),
        ...sharedEventData,
      },
      memberStatusUpdate: {
        ...(connection.postMessageEventData?.memberStatusUpdate || {}),
        ...sharedEventData,
        connection_status: connectionStatus,
      },
    },
    is_being_aggregated: connection.is_being_aggregated,
    user_guid: userId,
    mfa: {
      credentials: connection.challenges?.map((c) => {
        const ret = {
          guid: c.id,
          credential_guid: c.id,
          label: c.question,
          type: c.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options: [] as any[],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        switch (c.type) {
          case ChallengeType.QUESTION:
            ret.type = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ret.label = (c.data as any[])?.[0].value || c.question;
            break;
          case ChallengeType.TOKEN:
            ret.type = 2; // ?
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            ret.label = `${c.question}: ${c.data}`;
            break;
          case ChallengeType.IMAGE:
            ret.type = 13;
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ret.meta_data = (c.data as string).startsWith("data:image")
              ? c.data
              : "data:image/png;base64, " + c.data;
            break;
          case ChallengeType.OPTIONS:
            ret.type = 2;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ret.options = (c.data as any[]).map((d) => ({
              guid: d.key,
              label: d.key,
              value: d.value,
              credential_guid: c.id,
            }));
            break;
          case ChallengeType.IMAGE_OPTIONS:
            ret.type = 14;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ret.options = (c.data as any[]).map((d) => ({
              guid: d.key,
              label: d.key,
              data_uri: d.value,
              credential_guid: c.id,
            }));
            break;
        }
        return ret;
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function mapCredentialToChallenge(
  credential: Credential,
  mfaCredentials: Credential[],
): Challenge {
  const challenge = mfaCredentials.find((m) => m.guid === credential.guid);
  let type: number;
  let response = credential.value;

  if (challenge) {
    switch (challenge.type) {
      case 0:
        type = ChallengeType.QUESTION;
        break;
      case 13:
        type = ChallengeType.IMAGE;
        break;
      case 2:
        type = credential.value ? ChallengeType.OPTIONS : ChallengeType.TOKEN;
        if (credential.value) {
          response = challenge.options.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (option: any) => option.guid === credential.value,
          )?.value;
          if (!response) {
            logger.error(
              `Unexpected challenge option: ${credential.value}: `,
              challenge,
            );
          }
        }
        break;
    }
  }

  return {
    id: credential.guid,
    type,
    response,
  };
}

export class ConnectApi extends AggregatorAdapterBase {
  isRefreshConnection?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-explicit-any
  constructor(req: any) {
    super(req);
    this.isRefreshConnection = !!(
      req.context.aggregator && req.context.connectionId
    );
  }

  #getShouldRecordPerformance() {
    return !!(!this.isRefreshConnection && this.getPerformanceEnabled());
  }

  async addMember(memberData: Member): Promise<MemberResponse> {
    const performanceSessionId = crypto.randomUUID();
    this.context.performanceSessionId = performanceSessionId;

    const aggregatorId = getAggregatorIdFromTestAggregatorId(
      this.context.aggregator,
    );

    let startEvent: Promise<void> | undefined;

    if (this.#getShouldRecordPerformance()) {
      startEvent = recordStartEvent({
        aggregatorId,
        connectionId: performanceSessionId,
        institutionId: memberData?.rawInstitutionData?.ucpInstitutionId,
        jobTypes: this.context.jobTypes,
        recordDuration: this.getShouldRecordPerformanceDuration(),
      });
    }

    const connection = await this.createConnection({
      id: memberData.guid,
      institutionId: memberData.institution_guid,
      is_oauth: memberData.is_oauth ?? false,
      skip_aggregation:
        (memberData.skip_aggregation ?? false) &&
        (memberData.is_oauth ?? false),
      jobTypes: this.context.jobTypes,
      credentials:
        memberData.credentials?.map((c) => ({
          id: c.guid,
          value: c.value,
        })) ?? [],
      performanceSessionId,
    });

    if (startEvent && memberData.is_oauth) {
      startEvent.then(() =>
        recordConnectionPauseEvent(performanceSessionId, false),
      );
    }

    if (
      this.#getShouldRecordPerformance() &&
      this.getRequiresPollingForPerformance()
    ) {
      createPerformancePollingObject({
        userId: this.getUserId(),
        connectionId: connection.id,
        performanceSessionId,
        aggregatorId: this.context.aggregator, // Must use the original aggregator string to request status from sandbox or prod adapters.
      });
    }

    return { member: mapConnection(connection) };
  }

  async updateMember(member: Member): Promise<Member> {
    if (this.context.current_job_id && member.credentials !== undefined) {
      this.#getShouldRecordPerformance() &&
        recordConnectionResumeEvent(this.context.performanceSessionId);

      const challenges = member.credentials.map((credential) =>
        mapCredentialToChallenge(credential, member.mfa?.credentials ?? []),
      );

      await this.answerChallenge(member.guid, challenges);
      return member;
    } else {
      this.#getShouldRecordPerformance() &&
        setLastUiUpdateTimestamp(this.context.performanceSessionId);
      const connection = await this.updateConnection({
        jobTypes: this.context.jobTypes,
        id: member.guid,
        credentials: member.credentials?.map((c) => ({
          id: c.guid,
          value: c.value,
        })),
      });
      return mapConnection(connection);
    }
  }

  async loadMembers(): Promise<Member[]> {
    if (this.context.connectionId != null && this.context.connectionId !== "") {
      const focusedMember = await this.getConnection(this.context.connectionId);
      return [mapConnection(focusedMember)];
    }
    return [];
  }

  async loadMemberByGuid(memberGuid: string): Promise<Member> {
    const member = await this.getConnectionStatus(memberGuid);
    if (this.#getShouldRecordPerformance()) {
      if (member?.challenges?.length > 0) {
        recordConnectionPauseEvent(this.context.performanceSessionId);
      } else {
        setLastUiUpdateTimestamp(this.context.performanceSessionId);
      }
    }

    if (member?.institution_code == null) {
      const connection = await this.getConnection(memberGuid);

      if (
        member?.status === ConnectionStatus.CONNECTED &&
        this.#getShouldRecordPerformance()
      ) {
        if (connection?.is_being_aggregated) {
          if (connection?.is_oauth) {
            recordConnectionResumeEvent(this.context.performanceSessionId);
          }
        } else {
          recordSuccessEvent(this.context.performanceSessionId);
        }
      }

      return mapConnection({ ...member, ...connection });
    }

    return mapConnection({ ...member });
  }

  async deleteMember(member: Member): Promise<void> {
    await this.deleteConnection(member.guid);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMemberCredentials(memberGuid: string): Promise<any> {
    const crs = await this.getConnectionCredentials(memberGuid);
    return crs.map((c) => ({
      ...c,
      guid: c.id,
      field_type: c.field_type === "PASSWORD" ? 1 : 3,
    }));
  }
}
