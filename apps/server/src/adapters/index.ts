import { createAggregatorWidgetAdapter } from "../adapterIndex";
import { set } from "../services/storageClient/redis";
import type { Context, Aggregator } from "../shared/contract";
import type {
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import { OAuthStatus } from "@repo/utils";

import { ConnectionStatus } from "../shared/contract";

export class AggregatorAdapterBase {
  context: Context;
  aggregatorAdapter: WidgetAdapter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(req: any) {
    this.context = req.context;
  }

  async init() {
    try {
      if (this.context?.aggregator) {
        this.aggregatorAdapter = createAggregatorWidgetAdapter({
          aggregator: this.context?.aggregator as Aggregator,
        });
      }
      return true;
    } catch (err) {
      // do nothing
    }

    return false;
  }

  getShouldRecordPerformanceDuration() {
    if (
      this.aggregatorAdapter &&
      typeof this.aggregatorAdapter.getShouldRecordPerformanceDuration ===
        "function"
    ) {
      return this.aggregatorAdapter.getShouldRecordPerformanceDuration();
    }
    return true;
  }

  getNeedsLocalPerformanceResilience() {
    if (
      this.aggregatorAdapter &&
      typeof this.aggregatorAdapter.getNeedsLocalPerformanceResilience ===
        "function"
    ) {
      return this.aggregatorAdapter.getNeedsLocalPerformanceResilience();
    }
    return true;
  }

  async getConnection(connectionId: string): Promise<Connection> {
    return await this.aggregatorAdapter.GetConnectionById(
      connectionId,
      this.getUserId(),
    );
  }

  async getConnectionStatus(connectionId: string): Promise<Connection> {
    return await this.aggregatorAdapter.GetConnectionStatus(
      connectionId,
      this.context.current_job_id,
      this.context.singleAccountSelect,
      this.getUserId(),
    );
  }

  async createConnection(
    connection: CreateConnectionRequest,
  ): Promise<Connection> {
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
    this.context.current_job_id = ret.cur_job_id;
    if (ret?.id != null) {
      await set(`context_${ret.id}`, {
        oauth_referral_source: this.context.oauth_referral_source,
        scheme: this.context.scheme,
      });
    }
    return ret;
  }

  async answerChallenge(connectionId: string, challenges: Challenge[]) {
    return await this.aggregatorAdapter.AnswerChallenge(
      {
        id: connectionId ?? this.context.connectionId,
        challenges,
      },
      this.context.current_job_id,
      this.getUserId(),
    );
  }

  async getOauthState(connectionId: string) {
    const connection = await this.getConnectionStatus(connectionId);

    if (connection == null) {
      return {};
    }

    const ret = {
      guid: connectionId,
      inbound_member_guid: connectionId,
      outbound_member_guid: connectionId,
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
    return ret;
  }

  async getOauthStates(memberGuid: string) {
    const state = await this.getOauthState(memberGuid);
    return [state];
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.aggregatorAdapter.DeleteConnection(
      connectionId,
      this.getUserId(),
    );
  }

  async getConnectionCredentials(memberGuid: string): Promise<Credential[]> {
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
    return this.context.resolvedUserId;
  }
}
