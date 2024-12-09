// eslint-disable @typescript-eslint/naming-convention
import { aggregators } from "../adapterSetup";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import * as logger from "../infra/logger";
import { AnalyticsClient } from "../services/analyticsClient";
import { resolveInstitutionAggregator } from "../services/institutionResolver";
import { set } from "../services/storageClient/redis";
import type { Context, MappedJobTypes, Aggregator } from "../shared/contract";
import type {
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";

import { ConnectionStatus, OAuthStatus } from "../shared/contract";
import { decodeAuthToken, mapJobType } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function instrumentation(context: Context, input: any) {
  const { user_id } = input;
  context.user_id = user_id;

  if (!user_id) {
    return false;
  }

  if (Boolean(input.current_member_guid) && Boolean(input.current_aggregator)) {
    context.aggregator = input.current_aggregator;
    context.connection_id = input.current_member_guid;
  }
  if (input.auth != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.auth = decodeAuthToken(input.auth) as any;
  }
  context.partner = input.current_partner;
  context.job_type = mapJobType(input.job_type);
  context.scheme = input.scheme ?? "vcs";
  context.oauth_referral_source = input.oauth_referral_source ?? "BROWSER";
  context.single_account_select = input.single_account_select;
  context.updated = true;
  return true;
}

export class AggregatorAdapterBase {
  context: Context;
  aggregatorAdapter: WidgetAdapter;
  analyticsClient: AnalyticsClient;
  aggregators: string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(req: any) {
    this.context = req.context;
  }

  async init() {
    const token = "fakeTokenThatWeNeedToRemove";

    this.analyticsClient = new AnalyticsClient(token);
    try {
      if (this.context?.aggregator) {
        this.aggregatorAdapter = createAggregatorWidgetAdapter(
          this.context?.aggregator as Aggregator,
        );
      }
      this.aggregators = aggregators;
      return true;
    } catch (err) {
      logger.error("Error parsing auth token", err);
    }

    return false;
  }

  async resolveInstitution(id: string): Promise<Institution> {
    const resolvedInstitution = await resolveInstitutionAggregator(
      id,
      this.context.job_type as MappedJobTypes,
    );
    this.context.aggregator = resolvedInstitution.aggregator;
    this.context.updated = true;
    this.context.institution_id = resolvedInstitution.id;
    this.context.resolved_user_id = null;
    await this.init();
    return resolvedInstitution;
  }

  async getAggregatorInstitution(ucpId: string): Promise<Institution> {
    const resolved = await this.resolveInstitution(ucpId);
    const inst = await this.aggregatorAdapter.GetInstitutionById(resolved.id);
    if (inst != null) {
      inst.name = resolved.name ?? inst.name;
      inst.url = resolved?.url ?? inst.url?.trim();
      inst.logo_url = resolved?.logo_url ?? inst.logo_url?.trim();
    }
    return inst;
  }

  async getInstitutionCredentials(guid: string): Promise<Credential[]> {
    this.context.updated = true;
    this.context.current_job_id = null;
    // let id = await this.resolveInstitution(guid)
    return await this.aggregatorAdapter.ListInstitutionCredentials(guid);
  }

  async getConnection(connection_id: string): Promise<Connection> {
    return await this.aggregatorAdapter.GetConnectionById(
      connection_id,
      this.getUserId(),
    );
  }

  async getConnectionStatus(connection_id: string): Promise<Connection> {
    return await this.aggregatorAdapter.GetConnectionStatus(
      connection_id,
      this.context.current_job_id,
      this.context.single_account_select,
      this.getUserId(),
    );
  }

  async createConnection(
    connection: CreateConnectionRequest,
  ): Promise<Connection> {
    this.context.updated = true;
    this.context.current_job_id = null;
    const ret = await this.aggregatorAdapter.CreateConnection(
      connection,
      this.getUserId(),
    );
    this.context.current_job_id = ret.cur_job_id;
    if (ret?.id != null) {
      await set(`context_${ret.id}`, {
        oauth_referral_source: this.context.oauth_referral_source,
        scheme: this.context.scheme,
      });
    }
    return ret;
  }

  async updateConnection(
    connection: UpdateConnectionRequest,
  ): Promise<Connection> {
    const ret = await this.aggregatorAdapter.UpdateConnection(
      connection,
      this.getUserId(),
    );
    this.context.updated = true;
    this.context.current_job_id = ret.cur_job_id;
    if (ret?.id != null) {
      await set(`context_${ret.id}`, {
        oauth_referral_source: this.context.oauth_referral_source,
        scheme: this.context.scheme,
      });
    }
    return ret;
  }

  async answerChallenge(connection_id: string, challenges: Challenge[]) {
    return await this.aggregatorAdapter.AnswerChallenge(
      {
        id: connection_id ?? this.context.connection_id,
        challenges,
      },
      this.context.current_job_id,
      this.getUserId(),
    );
  }

  async getOauthWindowUri(memberGuid: string) {
    const ret = await this.getConnection(memberGuid);
    return ret?.oauth_window_uri;
  }

  async getOauthState(connection_id: string) {
    const connection = await this.getConnectionStatus(connection_id);

    if (connection == null) {
      return {};
    }

    const ret = {
      guid: connection_id,
      inbound_member_guid: connection_id,
      outbound_member_guid: connection_id,
      auth_status:
        connection.status === ConnectionStatus.PENDING
          ? OAuthStatus.PENDING
          : connection.status === ConnectionStatus.CONNECTED
            ? OAuthStatus.COMPLETE
            : OAuthStatus.ERROR,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (ret.auth_status === OAuthStatus.ERROR) {
      ret.error_reason = connection.status;
    }
    return { oauth_state: ret };
  }

  async getOauthStates(memberGuid: string) {
    const state = await this.getOauthState(memberGuid);
    return {
      oauth_states: [state.oauth_state],
    };
  }

  async deleteConnection(connection_id: string): Promise<void> {
    await this.aggregatorAdapter.DeleteConnection(
      connection_id,
      this.getUserId(),
    );
  }

  async getConnectionCredentials(memberGuid: string): Promise<Credential[]> {
    this.context.updated = true;
    this.context.current_job_id = null;
    return await this.aggregatorAdapter.ListConnectionCredentials(
      memberGuid,
      this.getUserId(),
    );
  }

  async ResolveUserId(id: string, failIfNotFound: boolean = false) {
    return await this.aggregatorAdapter?.ResolveUserId(id, failIfNotFound);
  }

  getUserId(): string {
    return this.context.resolved_user_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async analytics(path: string, content: any) {
    return await this.analyticsClient?.analytics(
      path.replaceAll("/", ""),
      content,
    );
  }
}
