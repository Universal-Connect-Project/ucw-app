import type { Member, MemberResponse } from "interfaces/contract";
import * as logger from "../infra/logger";
import type {
  CachedInstitution,
  InstitutionSearchResponseItem,
} from "../shared/contract";
import type { Challenge, Connection, Institution } from "@repo/utils";
import { ChallengeType, ConnectionStatus } from "@repo/utils";

import { AggregatorAdapterBase } from "../adapters";
import { getRecommendedInstitutions } from "../services/ElasticSearchClient";

function mapResolvedInstitution(ins: Institution) {
  return {
    guid: ins.id,
    code: ins.id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo_url,
    instructional_data: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credentials: [] as any[],
    supports_oauth: ins.oauth ?? ins.name?.includes("Oauth"),
    aggregators: ins.aggregators,
    aggregator: ins.aggregator,
  };
}

export function mapCachedInstitution(
  ins: CachedInstitution,
): InstitutionSearchResponseItem {
  const supportsOauth =
    ins?.mx?.supports_oauth || ins?.sophtron?.supports_oauth;
  // || ins.finicity.supports_oauth || ins.akoya.supports_oauth
  return {
    guid: ins.id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo,
    supports_oauth: supportsOauth,
  };
}

function mapConnection(connection: Connection): Member {
  return {
    institution_guid: connection.institution_code,
    guid: connection.id,
    connection_status: connection.status ?? ConnectionStatus.CREATED, // ?
    most_recent_job_guid:
      connection.status === ConnectionStatus.CONNECTED
        ? connection.cur_job_id
        : null,
    is_oauth: connection.is_oauth,
    oauth_window_uri: connection.oauth_window_uri,
    aggregator: connection.aggregator,
    is_being_aggregated: connection.is_being_aggregated,
    user_guid: connection.userId,
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

export class ConnectApi extends AggregatorAdapterBase {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-explicit-any
  constructor(req: any) {
    super(req);
  }

  async addMember(memberData: Member): Promise<MemberResponse> {
    const connection = await this.createConnection({
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
    });
    return { member: mapConnection(connection) };
  }

  async updateMember(member: Member): Promise<Member> {
    if (this.context.current_job_id && member.credentials !== undefined) {
      await this.answerChallenge(
        member.guid,
        member.credentials.map((c) => {
          const ret: Challenge = {
            id: c.guid,
            type: c.field_type,
            response: c.value,
          };
          const challenge = member.mfa?.credentials.find(
            (m) => m.guid === c.guid,
          ); // widget posts everything back
          switch (challenge?.type) {
            case 0:
              ret.type = ChallengeType.QUESTION;
              break;
            case 13:
              ret.type = ChallengeType.IMAGE;
              break;
            case 2:
              ret.type = c.value ? ChallengeType.OPTIONS : ChallengeType.TOKEN;
              if (c.value) {
                ret.response = challenge?.options.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (o: any) => o.guid === c.value,
                )?.value;
                if (!ret.response) {
                  logger.error(
                    `Unexpected challege option: ${c.value}: `,
                    challenge,
                  );
                }
              }
              break;
          }
          return ret;
        }),
      );
      return member;
    } else {
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
    if (
      this.context.connection_id != null &&
      this.context.connection_id !== ""
    ) {
      const focusedMember = await this.getConnection(
        this.context.connection_id,
      );
      return [mapConnection(focusedMember)];
    }
    return [];
  }

  async loadMemberByGuid(memberGuid: string): Promise<Member> {
    const mfa = await this.getConnectionStatus(memberGuid);
    if (mfa?.institution_code == null) {
      const connection = await this.getConnection(memberGuid);
      return mapConnection({ ...mfa, ...connection });
    }
    return mapConnection({ ...mfa });
  }

  async getOauthWindowUri(memberGuid: string) {
    const ret = await this.loadMemberByGuid(memberGuid);
    return ret?.oauth_window_uri;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getInstitutionCredentials(guid: string): Promise<any> {
    const crs = await super.getInstitutionCredentials(guid);
    return crs.map((c) => ({
      ...c,
      guid: c.id,
      field_type: c.field_type === "PASSWORD" ? 1 : 3,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadInstitutionByUcpId(ucpId: string): Promise<any> {
    const inst = await this.getAggregatorInstitution(ucpId);
    return mapResolvedInstitution(inst);
  }

  async loadInstitutionByAggregatorId(
    aggregatorInstitutionId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    await this.init();

    const institution = await this.aggregatorAdapter.GetInstitutionById(
      aggregatorInstitutionId,
    );

    return mapResolvedInstitution(institution);
  }

  async loadPopularInstitutions() {
    this.context.updated = true;
    this.context.aggregator = null;

    const recommendedInstitutions = await getRecommendedInstitutions({
      jobTypes: this.context.jobTypes,
    });
    return recommendedInstitutions
      .filter((ins: CachedInstitution) => ins != null)
      .map(mapCachedInstitution);
  }
}
