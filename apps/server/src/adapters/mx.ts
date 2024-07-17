import config from '../config'
import * as logger from '../infra/logger'
import type {
  CredentialRequest,
  CredentialsResponseBody,
  MemberResponse,
  MxPlatformApiFactory
} from '../providerApiClients/mx'
import { MxIntApiClient, MxProdApiClient } from '../providerApiClients/mx'
import { get, set } from '../services/storageClient/redis'
import type {
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '../shared/contract'
import { ChallengeType, ConnectionStatus } from '../shared/contract'

export const EXTENDED_HISTORY_NOT_SUPPORTED_MSG =
  "Member's institution does not support extended transaction history."

interface HandleOauthReponseRequest {
  member_guid: string
  status: string
  error_reason: string
}

function mapCredentials(mxCreds: CredentialsResponseBody): Credential[] {
  if (mxCreds.credentials != null) {
    return mxCreds.credentials.map((item) => ({
      id: item.guid,
      label: item.field_name,
      field_type: item.field_type,
      field_name: item.field_name
    }))
  } else {
    return []
  }
}

function fromMxMember(member: MemberResponse, provider: string): Connection {
  return {
    id: member.guid,
    cur_job_id: member.guid,
    // institution_code: entityId, // TODO
    institution_code: member.institution_code, // TODO
    is_being_aggregated: member.is_being_aggregated,
    is_oauth: member.is_oauth,
    oauth_window_uri: member.oauth_window_uri,
    provider
  }
}

export class MxAdapter implements WidgetAdapter {
  apiClient: ReturnType<typeof MxPlatformApiFactory>
  provider: string

  constructor(int: boolean) {
    this.provider = int ? 'mx_int' : 'mx'

    this.apiClient = int ? MxIntApiClient : MxProdApiClient
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    const res = await this.apiClient.readInstitution(id)
    // TODO: if this is 401 we should throw an error
    const institution = res.data.institution
    return {
      id: institution.code,
      logo_url: institution.medium_logo_url ?? institution.small_logo_url,
      name: institution.name,
      oauth: institution.supports_oauth,
      url: institution.url,
      provider: this.provider
    }
  }

  async ListInstitutionCredentials(
    institutionId: string
  ): Promise<Credential[]> {
    const res = await this.apiClient.listInstitutionCredentials(institutionId)
    return mapCredentials(res.data)
  }

  async ListConnections(userId: string): Promise<Connection[]> {
    const res = await this.apiClient.listMembers(userId)

    return (
      res.data.members?.map((member) => fromMxMember(member, this.provider)) ??
      []
    )
  }

  async ListConnectionCredentials(
    memberId: string,
    userId: string
  ): Promise<Credential[]> {
    const res = await this.apiClient.listMemberCredentials(memberId, userId)
    return mapCredentials(res.data)
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    const jobType = request.initial_job_type
    const entityId = request.institution_id
    const existings = await this.apiClient.listMembers(userId)
    const existing = existings.data.members.find(
      (m) => m.institution_code === entityId
    )
    if (existing != null) {
      logger.info(`Found existing member for institution ${entityId}, deleting`)
      await this.apiClient.deleteMember(existing.guid, userId)
    }
    // let res = await this.apiClient.listInstitutionCredentials(entityId)
    // console.log(request)
    const memberRes = await this.apiClient.createMember(userId, {
      referral_source: 'APP', // request.is_oauth ? 'APP' : '',
      client_redirect_url: request.is_oauth
        ? `${config.HostUrl}/oauth_redirect`
        : null,
      member: {
        skip_aggregation: request.skip_aggregation || jobType !== 'aggregate',
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
    } as any)
    // console.log(memberRes)
    const member = memberRes.data.member
    // console.log(member)
    if (!request?.is_oauth) {
      if (
        ['verification', 'aggregate_identity_verification'].includes(jobType)
      ) {
        const updatedMemberRes = await this.apiClient.verifyMember(
          member.guid,
          userId
        )
        return fromMxMember(updatedMemberRes.data.member, this.provider)
      } else if (jobType === 'aggregate_identity') {
        const updatedMemberRes = await this.apiClient.identifyMember(
          member.guid,
          userId
        )
        return fromMxMember(updatedMemberRes.data.member, this.provider)
      } else if (jobType === 'aggregate_extendedhistory') {
        const updatedMemberRes = await this.apiClient.extendHistory(
          member.guid,
          userId
        )
        return fromMxMember(updatedMemberRes.data.member, this.provider)
      }
    }

    return fromMxMember(member, this.provider)
  }

  async DeleteConnection(id: string, userId: string): Promise<void> {
    await this.apiClient.deleteManagedMember(id, userId)
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    let ret
    if (request.job_type === 'verification') {
      ret = await this.apiClient.verifyMember(request.id, userId)
    } else if (request.job_type === 'aggregate_identity') {
      ret = await this.apiClient.identifyMember(request.id, userId, {
        data: { member: { include_transactions: true } }
      })
    } else if (request.job_type === 'aggregate_extendedhistory') {
      ret = await this.apiClient.extendHistory(request.id, userId)
    } else {
      ret = await this.apiClient.aggregateMember(request.id, userId)
    }

    if (ret?.data?.error?.message === EXTENDED_HISTORY_NOT_SUPPORTED_MSG) {
      ret = await this.apiClient.aggregateMember(request.id, userId)
    }

    if (ret.data?.error) {
      return { id: request.id, error_message: ret.data.error.message }
    }

    return fromMxMember(ret.data.member, this.provider)
  }

  async UpdateConnectionInternal(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    const ret = await this.apiClient.updateMember(request.id, userId, {
      member: {
        credentials: request.credentials.map(
          (credential) =>
            ({
              guid: credential.id,
              value: credential.value
            }) satisfies CredentialRequest
        )
      }
    })
    const member = ret.data.member
    return fromMxMember(member, this.provider)
  }

  async GetConnectionById(
    connectionId: string,
    userId: string
  ): Promise<Connection> {
    const res = await this.apiClient.readMember(connectionId, userId)
    const member = res.data.member
    return {
      id: member.guid,
      institution_code: member.institution_code,
      is_oauth: member.is_oauth,
      is_being_aggregated: member.is_being_aggregated,
      oauth_window_uri: member.oauth_window_uri,
      provider: this.provider,
      user_id: userId
    }
  }

  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    singleAccountSelect: boolean,
    userId: string
  ): Promise<Connection> {
    const res = await this.apiClient.readMemberStatus(memberId, userId)
    const member = res.data.member
    let status = member.connection_status
    const oauthStatus = await get(member.guid)
    if (oauthStatus?.error != null) {
      status = ConnectionStatus[ConnectionStatus.REJECTED]
    }
    return {
      provider: this.provider,
      id: member.guid,
      cur_job_id: member.guid,
      user_id: userId,
      // is_oauth: member.is_oauth,
      // oauth_window_uri: member.oauth_window_uri,
      // status: member.connection_status,
      // error_reason: oauthStatus?.error_reason,
      status: ConnectionStatus[status as keyof typeof ConnectionStatus],
      challenges: (member.challenges ?? []).map((item, idx) => {
        const challenge: Challenge = {
          id: item.guid ?? `${idx}`,
          type: ChallengeType.QUESTION,
          question: item.label
        }
        switch (item.type) {
          case 'TEXT':
            challenge.type = ChallengeType.QUESTION
            challenge.data = [{ key: `${idx}`, value: item.label }]
            break
          case 'OPTIONS':
            challenge.type = ChallengeType.OPTIONS
            challenge.question = item.label
            challenge.data = (item.options ?? []).map((o) => ({
              key: o.label ?? o.value,
              value: o.value
            }))
            break
          case 'TOKEN':
            challenge.type = ChallengeType.TOKEN
            challenge.data = item.label!
            break
          case 'IMAGE_DATA':
            challenge.type = ChallengeType.IMAGE
            challenge.data = item.image_data!
            break
          case 'IMAGE_OPTIONS':
            // console.log(c)
            challenge.type = ChallengeType.IMAGE_OPTIONS
            challenge.data = (item.image_options ?? []).map((io) => ({
              key: io.label ?? io.value,
              value: io.data_uri ?? io.value
            }))
            break
          default:
            break // todo?
        }
        return challenge
      })
    }
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string,
    userId: string
  ): Promise<boolean> {
    await this.apiClient.resumeAggregation(request.id, userId, {
      member: {
        challenges: request.challenges.map((item, idx) => ({
          guid: item.id ?? `${idx}`,
          value: item.response as string
        }))
      }
    })
    return true
  }

  async ResolveUserId(userId: string): Promise<string> {
    logger.debug('Resolving UserId: ' + userId)
    const res = await this.apiClient.listUsers(1, 10, userId)
    const mxUser = res.data?.users?.find((u) => u.id === userId)
    if (mxUser != null) {
      logger.trace(`Found existing mx user ${mxUser.guid}`)
      return mxUser.guid
    }
    logger.trace(`Creating mx user ${userId}`)
    const ret = await this.apiClient.createUser({
      user: { id: userId }
    })
    if (ret?.data?.user != null) {
      return ret.data.user.guid
    }
    logger.trace(`Failed creating mx user, using user_id: ${userId}`)
    return userId
  }

  static async HandleOauthResponse(
    request: HandleOauthReponseRequest
  ): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { member_guid, status, error_reason } = request
    if (status === 'error') {
      await set(member_guid, {
        error: true,
        error_reason
      })
    }
    const ret = {
      id: member_guid,
      error: error_reason,
      status:
        status === 'error'
          ? ConnectionStatus.REJECTED
          : status === 'success'
            ? ConnectionStatus.CONNECTED
            : ConnectionStatus.PENDING
    }
    return ret
  }
}
