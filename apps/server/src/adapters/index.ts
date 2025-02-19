// eslint-disable @typescript-eslint/naming-convention
import { aggregators } from "../adapterSetup";
import { createAggregatorWidgetAdapter } from "../adapterIndex";
import * as logger from "../infra/logger";
import { AnalyticsClient } from "../services/analyticsClient";
import { resolveInstitutionAggregator } from "../services/institutionResolver";
import { set } from "../services/storageClient/redis";
import type { Context, Aggregator } from "../shared/contract";
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
    this.analyticsClient = new AnalyticsClient("temp_fake_authToken");
    try {
      if (this.context?.aggregator) {
        this.aggregatorAdapter = createAggregatorWidgetAdapter({
          aggregator: this.context?.aggregator as Aggregator,
          sessionId: this.context.session_id,
        });
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
      this.context.jobTypes,
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
