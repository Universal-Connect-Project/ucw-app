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
