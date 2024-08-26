import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution,
  UpdateConnectionRequest,
  WidgetAdapter
} from '../shared/contract'
import { ConnectionStatus, Providers } from '../shared/contract'

interface HandleOauthReponseRequest {
  member_guid: string
  status: string
  error_reason: string
}

export class TestAdapter implements WidgetAdapter {
  async GetInstitutionById(id: string): Promise<Institution> {
    return {
      id: 'testid',
      logo_url:
        'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
      name: 'testname',
      oauth: false,
      url: 'testurl',
      provider: Providers.TEST_EXAMPLE
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
        label: 'fieldLabel'
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
        provider: Providers.TEST_EXAMPLE
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
      provider: Providers.TEST_EXAMPLE
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
      provider: Providers.TEST_EXAMPLE
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
      provider: Providers.TEST_EXAMPLE
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
      provider: Providers.TEST_EXAMPLE,
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
      provider: Providers.TEST_EXAMPLE,
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

  static async HandleOauthResponse(
    request: HandleOauthReponseRequest
  ): Promise<Connection> {
    return {
      id: 'member_guid',
      status: ConnectionStatus.CONNECTED
    }
  }
}
