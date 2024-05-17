import {
  type Connection,
  ConnectionStatus,
  type CreateConnectionRequest,
  type Credential,
  type Institution,
  type ProviderApiClient,
  type UpdateConnectionRequest,
} from "../shared/contract"
import * as logger from "../infra/logger"
import AkoyaClient from "../serviceClients/akoyaClient"
import { StorageClient } from "../serviceClients/storageClient"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require("uuid")

export class AkoyaApi implements ProviderApiClient {
  sandbox: boolean
  apiClient: any
  db: StorageClient
  token: string
  constructor(config: any, sandbox: boolean) {
    const { akoyaProd, akoyaSandbox, token, storageClient } = config
    this.token = token
    this.db = storageClient
    this.sandbox = sandbox
    this.apiClient = new AkoyaClient(sandbox ? akoyaSandbox : akoyaProd)
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    return await Promise.resolve({
      id,
      name: null,
      logo_url: null,
      url: null,
      oauth: true,
      provider: this.apiClient.apiConfig.provider,
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
    const request_id = `${this.token}${uuidv4().replaceAll("-", "")}`
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
      status: ConnectionStatus.PENDING,
    }
    await this.db.set(request_id, obj)
    return obj
  }

  async DeleteConnection(id: string): Promise<void> {
    return await this.db.set(id, null)
  }

  async UpdateConnection(
    request: UpdateConnectionRequest
  ): Promise<Connection> {
    return null
  }

  async GetConnectionById(connectionId: string): Promise<Connection> {
    return await this.db.get(connectionId)
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async GetConnectionStatus(
    connectionId: string,
    jobId: string,
    single_account_select?: boolean,
    user_id?: string
  ): Promise<Connection> {
    return await this.db.get(connectionId)
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
    const db = new StorageClient()
    const connection = await db.get(request_id)
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
    await db.set(request_id, connection)
    connection.storageClient = db
    return connection
  }
}
