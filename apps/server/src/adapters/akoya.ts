import * as logger from '../infra/logger'
import AkoyaClient from '../providerApiClients/akoya'
import providerCredentials from '../providerCredentials'
import { get, set } from '../services/storageClient/redis'
import {
  type Connection,
  ConnectionStatus,
  type CreateConnectionRequest,
  type Credential,
  type Institution,
  type UpdateConnectionRequest,
  type WidgetAdapter
} from '../shared/contract'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid')

export class AkoyaAdapter implements WidgetAdapter {
  sandbox: boolean
  apiClient: any
  token: string
  constructor(sandbox: boolean) {
    this.token = 'thisNeverWorked'
    this.sandbox = sandbox
    this.apiClient = new AkoyaClient(
      sandbox ? providerCredentials.akoyaSandbox : providerCredentials.akoyaProd
    )
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    return await Promise.resolve({
      id,
      name: null,
      logo_url: null,
      url: null,
      oauth: true,
      provider: this.apiClient.apiConfig.provider
    })
  }

  async ListInstitutionCredentials(id: string): Promise<Credential[]> {
    return await Promise.resolve([])
  }

  async ListConnectionCredentials(
    connectionId: string,
    userId: string
  ): Promise<Credential[]> {
    return await Promise.resolve([])
  }

  async ListConnections(userId: string): Promise<Connection[]> {
    return await Promise.resolve([])
  }

  async CreateConnection(
    request: CreateConnectionRequest
  ): Promise<Connection | undefined> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const request_id = `${this.token}${uuidv4().replaceAll('-', '')}`
    const obj = {
      id: request_id,
      is_oauth: true,
      credentials: [] as any[],
      institution_code: request.institution_id,
      oauth_window_uri: this.apiClient.getOauthUrl(
        request.institution_id,
        this.apiClient.client_redirect_url,
        request_id
      ),
      provider: this.apiClient.apiConfig.provider,
      status: ConnectionStatus.PENDING
    }
    await set(request_id, obj)
    return obj
  }

  async DeleteConnection(id: string): Promise<void> {
    await set(id, null)

    return undefined
  }

  async UpdateConnection(
    request: UpdateConnectionRequest
  ): Promise<Connection> {
    return null
  }

  async GetConnectionById(connectionId: string): Promise<Connection> {
    return await get(connectionId)
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async GetConnectionStatus(
    connectionId: string,
    jobId: string,
    single_account_select?: boolean,
    user_id?: string
  ): Promise<Connection> {
    return await get(connectionId)
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string
  ): Promise<boolean> {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async ResolveUserId(user_id: string) {
    return user_id
  }

  static async HandleOauthResponse(request: any): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { state: request_id, code } = request
    logger.info(`Received akoya oauth redirect response ${request_id}`)
    const connection = await get(request_id)
    if (!connection) {
      return null
    }
    if (code) {
      connection.status = ConnectionStatus.CONNECTED
      connection.guid = connection.institution_code
      connection.id = connection.institution_code
      connection.user_id = code
      connection.request_id = request_id
    }
    // console.log(connection)
    await set(request_id, connection)

    return connection
  }
}
