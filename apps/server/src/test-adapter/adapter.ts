import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '@repo/utils'
import { ConnectionStatus } from '@repo/utils'
import { testExampleCredentials, testExampleInstitution } from './constants'
import { MappedJobTypes } from '../shared/contract'
import { get, set } from '../services/storageClient/redis'

const createRedisStatusKey = ({
  provider,
  userId
}: {
  provider: string
  userId: string
}) => `${provider}-${userId}`

export class TestAdapter implements WidgetAdapter {
  labelText: string
  provider: string

  constructor({
    labelText,
    provider
  }: {
    labelText: string
    provider: string
  }) {
    this.labelText = labelText
    this.provider = provider
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    return {
      ...testExampleInstitution,
      id,
      provider: this.provider
    }
  }

  async ListInstitutionCredentials(
    institutionId: string
  ): Promise<Credential[]> {
    return [
      {
        ...testExampleCredentials,
        label: this.labelText
      }
    ]
  }

  async ListConnections(userId: string): Promise<Connection[]> {
    return [
      {
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        provider: this.provider
      }
    ]
  }

  async ListConnectionCredentials(
    memberId: string,
    userId: string
  ): Promise<Credential[]> {
    return [
      {
        id: 'testId',
        field_name: 'testFieldName',
        field_type: 'testFieldType',
        label: this.labelText
      }
    ]
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    return {
      id: 'testId',
      cur_job_id: 'testJobId',
      institution_code: 'testCode',
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
      provider: this.provider
    }
  }

  async DeleteConnection(id: string, userId: string): Promise<void> {}

  async DeleteUser(providerUserId: string): Promise<any> {}

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    const redisStatusKey = createRedisStatusKey({
      provider: this.provider,
      userId
    })

    const connectionInfo = await get(redisStatusKey)

    if (
      !connectionInfo?.verifiedOnce &&
      request.job_type === MappedJobTypes.VERIFICATION
    ) {
      await set(redisStatusKey, {
        verifiedOnce: true
      })
    } else {
      await set(redisStatusKey, null)
    }

    return {
      id: 'testId',
      cur_job_id: 'testJobId',
      institution_code: 'testCode',
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
      provider: this.provider
    }
  }

  async UpdateConnectionInternal(
    request: UpdateConnectionRequest,
    userId: string
  ): Promise<Connection> {
    return {
      id: 'testId',
      cur_job_id: 'testJobId',
      institution_code: 'testCode',
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
      provider: this.provider
    }
  }

  async GetConnectionById(
    connectionId: string,
    userId: string
  ): Promise<Connection> {
    return {
      id: 'testId',
      institution_code: 'testCode',
      is_oauth: false,
      is_being_aggregated: false,
      oauth_window_uri: undefined,
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
    const connectionInfo = await get(
      createRedisStatusKey({ provider: this.provider, userId })
    )

    if (connectionInfo?.verifiedOnce && singleAccountSelect) {
      return {
        provider: this.provider,
        id: 'testId',
        cur_job_id: 'testJobId',
        user_id: 'testUserId',
        status: ConnectionStatus.CHALLENGED,
        challenges: [
          {
            id: 'CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011',
            type: 1,
            question: 'Please select an account:',
            data: [
              {
                key: 'Checking',
                value: 'act-23445745'
              },
              {
                key: 'Savings',
                value: 'act-352386787'
              }
            ]
          }
        ]
      }
    }

    return {
      provider: this.provider,
      id: 'testId',
      cur_job_id: 'testJobId',
      user_id: userId,
      status: ConnectionStatus.CONNECTED,
      challenges: []
    }
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string,
    userId: string
  ): Promise<boolean> {
    return true
  }

  async ResolveUserId(
    userId: string,
    failIfNotFound: boolean = false
  ): Promise<string> {
    return userId
  }
}
