/* eslint-disable @typescript-eslint/naming-convention */
import config from '../config'
import * as logger from '../infra/logger'
import providerCredentials from '../providerCredentials'
import { AnalyticsClient } from '../services/analyticsClient'
import { resolveInstitutionProvider } from '../services/institutionResolver'
import { get, set } from '../services/storageClient/redis'
import type {
  Challenge,
  Connection,
  Context,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '../shared/contract'
import { ConnectionStatus, OAuthStatus } from '../shared/contract'
import { decodeAuthToken, mapJobType } from '../utils'
import { AkoyaAdapter } from './akoya'
import { FinicityAdapter } from './finicity'
import { MxAdapter } from './mx'
import { SophtronAdapter } from './sophtron'

function getProviderAdapter(provider: string, config: any): WidgetAdapter {
  switch (provider) {
    case 'mx':
      return new MxAdapter(config, false)
    case 'mx_int':
      return new MxAdapter(config, true)
    case 'sophtron':
      return new SophtronAdapter(config)
    case 'akoya':
      return new AkoyaAdapter(config, false)
    case 'akoya_sandbox':
      return new AkoyaAdapter(config, true)
    case 'finicity':
    case 'finicity_sandbox':
      return new FinicityAdapter(config)
    default:
      // throw new Error(`Unsupported provider ${provider}`);
      return null
  }
}

export async function instrumentation(context: Context, input: any) {
  const { user_id } = input
  context.user_id = user_id
  if (!user_id || user_id === 'undefined' || user_id === 'test') {
    if (config.Demo) {
      logger.info('Using demo userId')
      context.user_id = 'Universal_widget_demo_user'
    } else {
      logger.info('Missing userId')
      return false
    }
  }

  if (context.user_id) {
    context.resolved_user_id = context.user_id
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
      const conf = providerCredentials
      this.providerAdapter = getProviderAdapter(this.context?.provider, conf)
      this.providers = Object.values(conf)
        .filter((v: any) => v.available)
        .map((v: any) => v.provider)
      return true
    } catch (err) {
      logger.error('Error parsing auth token', err)
    }

    return false
  }

  async resolveInstitution(id: string): Promise<Institution> {
    const resolvedInstitution = await resolveInstitutionProvider(id)
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

  async ResolveUserId(id: string) {
    return await this.providerAdapter?.ResolveUserId(id)
  }

  getUserId(): string {
    return this.context.resolved_user_id
  }

  static async handleOauthResponse(
    provider: string,
    rawParams: any,
    rawQueries: any,
    body: any
  ) {
    let res = {} as any
    switch (provider) {
      case 'akoya':
      case 'akoya_sandbox':
        res = await AkoyaAdapter.HandleOauthResponse({
          ...rawQueries,
          ...rawParams
        })
        break
      case 'finicity':
      case 'finicity_sandbox':
        res = await FinicityAdapter.HandleOauthResponse({
          ...rawQueries,
          ...rawParams,
          ...body
        })
        break
      case 'mx':
      case 'mx_int':
        res = await MxAdapter.HandleOauthResponse({
          ...rawQueries,
          ...rawParams,
          ...body
        })
        break
    }
    const ret = {
      ...res,
      provider
    }
    if (res?.id != null) {
      const context = await get(`context_${ret.request_id ?? ret.id}`)
      ret.scheme = context.scheme
      ret.oauth_referral_source = context.oauth_referral_source
    }
    return ret
  }

  async analytics(path: string, content: any) {
    return await this.analyticsClient?.analytics(
      path.replaceAll('/', ''),
      content
    )
  }
}
