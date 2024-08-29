import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '@repo/utils'
import { ConnectionStatus } from '@repo/utils'
import { PROVIDER_STRING, TEST_EXAMPLE_LABEL_TEXT } from './constants'

export class TestAdapter implements WidgetAdapter {
  async GetInstitutionById(id: string): Promise<Institution> {
    return {
      id: 'testid',
      logo_url:
        'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
      name: 'testname',
      oauth: false,
      url: 'testurl',
      provider: PROVIDER_STRING
    }
  }

  async ListInstitutionCredentials(
    institutionId: string
  ): Promise<Credential[]> {
    return [
      {
        id: 'testId',
        field_name: 'fieldName',
        field_type: 'fieldType',
        label: TEST_EXAMPLE_LABEL_TEXT
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
        provider: PROVIDER_STRING
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
        label: 'testFieldLabel'
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
      provider: PROVIDER_STRING
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
      provider: PROVIDER_STRING
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
      provider: PROVIDER_STRING
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
      provider: PROVIDER_STRING,
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
      provider: PROVIDER_STRING,
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
