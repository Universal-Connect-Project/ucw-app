/* eslint-disable @typescript-eslint/naming-convention */
import { getProviderAdapter } from '../adapterIndex'
import * as logger from '../infra/logger'
import providerCredentials from '../providerCredentials'
import { AnalyticsClient } from '../services/analyticsClient'
import { resolveInstitutionProvider } from '../services/institutionResolver'
import { set } from '../services/storageClient/redis'
import type {
  Challenge,
  Connection,
  Context,
  CreateConnectionRequest,
  Credential,
  Institution,
  MappedJobTypes,
  Provider,
  UpdateConnectionRequest,
  WidgetAdapter
} from '../shared/contract'
import { ConnectionStatus, OAuthStatus } from '../shared/contract'
import { decodeAuthToken, mapJobType } from '../utils'

export async function instrumentation(context: Context, input: any) {
  const { user_id } = input
  context.user_id = user_id

  if (!user_id) {
    return false
  }

  if (Boolean(input.current_member_guid) && Boolean(input.current_provider)) {
    context.provider = input.current_provider
    context.connection_id = input.current_member_guid
  }
  if (input.auth != null) {
    context.auth = decodeAuthToken(input.auth) as any
  }
  context.partner = input.current_partner
  context.job_type = mapJobType(input.job_type)
  context.scheme = input.scheme ?? 'vcs'
  context.oauth_referral_source = input.oauth_referral_source ?? 'BROWSER'
  context.single_account_select = input.single_account_select
  context.updated = true
  return true
}

export class ProviderAdapterBase {
  context: Context
  providerAdapter: WidgetAdapter
  analyticsClient: AnalyticsClient
  providers: string[]
  constructor(req: any) {
    this.context = req.context
  }

  async init() {
    const token = 'fakeTokenThatWeNeedToRemove'

    this.analyticsClient = new AnalyticsClient(token)
    try {
      if (this.context?.provider) {
        this.providerAdapter = getProviderAdapter(
          this.context?.provider as Provider
        )
      }
      this.providers = Object.values(providerCredentials)
        .filter((v: any) => v.available)
        .map((v: any) => v.provider)
      return true
    } catch (err) {
      logger.error('Error parsing auth token', err)
    }

    return false
  }

  async resolveInstitution(id: string): Promise<Institution> {
    const resolvedInstitution = await resolveInstitutionProvider(
      id,
      this.context.job_type as MappedJobTypes
    )
    this.context.provider = resolvedInstitution.provider
    this.context.updated = true
    this.context.institution_id = resolvedInstitution.id
    this.context.resolved_user_id = null
    await this.init()
    return resolvedInstitution
  }

  async getProviderInstitution(ucpId: string): Promise<Institution> {
    const resolved = await this.resolveInstitution(ucpId)
    const inst = await this.providerAdapter.GetInstitutionById(resolved.id)
    if (inst != null) {
      inst.name = resolved.name ?? inst.name
      inst.url = resolved?.url ?? inst.url?.trim()
      inst.logo_url = resolved?.logo_url ?? inst.logo_url?.trim()
    }
    return inst
  }

  async getInstitutionCredentials(guid: string): Promise<Credential[]> {
    this.context.updated = true
    this.context.current_job_id = null
    // let id = await this.resolveInstitution(guid)
    return await this.providerAdapter.ListInstitutionCredentials(guid)
  }

  async getConnection(connection_id: string): Promise<Connection> {
    return await this.providerAdapter.GetConnectionById(
      connection_id,
      this.getUserId()
    )
  }

  async getConnectionStatus(connection_id: string): Promise<Connection> {
    return await this.providerAdapter.GetConnectionStatus(
      connection_id,
      this.context.current_job_id,
      this.context.single_account_select,
      this.getUserId()
    )
  }

  async createConnection(
    connection: CreateConnectionRequest
  ): Promise<Connection> {
    this.context.updated = true
    this.context.current_job_id = null
    const ret = await this.providerAdapter.CreateConnection(
      connection,
      this.getUserId()
    )
    this.context.current_job_id = ret.cur_job_id
    if (ret?.id != null) {
      await set(`context_${ret.id}`, {
        oauth_referral_source: this.context.oauth_referral_source,
        scheme: this.context.scheme
      })
    }
    return ret
  }

  async updateConnection(
    connection: UpdateConnectionRequest
  ): Promise<Connection> {
    const ret = await this.providerAdapter.UpdateConnection(
      connection,
      this.getUserId()
    )
    this.context.updated = true
    this.context.current_job_id = ret.cur_job_id
    if (ret?.id != null) {
      await set(`context_${ret.id}`, {
        oauth_referral_source: this.context.oauth_referral_source,
        scheme: this.context.scheme
      })
    }
    return ret
  }

  async answerChallenge(connection_id: string, challenges: Challenge[]) {
    return await this.providerAdapter.AnswerChallenge(
      {
        id: connection_id ?? this.context.connection_id,
        challenges
      },
      this.context.current_job_id,
      this.getUserId()
    )
  }

  async getOauthWindowUri(memberGuid: string) {
    const ret = await this.getConnection(memberGuid)
    return ret?.oauth_window_uri
  }

  async getOauthState(connection_id: string) {
    const connection = await this.getConnectionStatus(connection_id)
    if (connection == null) {
      return {}
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
            : OAuthStatus.ERROR
    } as any
    if (ret.auth_status === OAuthStatus.ERROR) {
      ret.error_reason = connection.status
    }
    return { oauth_state: ret }
  }

  async getOauthStates(memberGuid: string) {
    const state = await this.getOauthState(memberGuid)
    return {
      oauth_states: [state.oauth_state]
    }
  }

  async deleteConnection(connection_id: string): Promise<void> {
    await this.providerAdapter.DeleteConnection(connection_id, this.getUserId())
  }

  async getConnectionCredentials(memberGuid: string): Promise<Credential[]> {
    this.context.updated = true
    this.context.current_job_id = null
    return await this.providerAdapter.ListConnectionCredentials(
      memberGuid,
      this.getUserId()
    )
  }

  async ResolveUserId(id: string, failIfNotFound: boolean = false) {
    return await this.providerAdapter?.ResolveUserId(id, failIfNotFound)
  }

  getUserId(): string {
    return this.context.resolved_user_id
  }

  async analytics(path: string, content: any) {
    return await this.analyticsClient?.analytics(
      path.replaceAll('/', ''),
      content
    )
  }
}
