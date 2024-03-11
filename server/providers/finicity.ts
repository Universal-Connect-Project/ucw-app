import {
  Challenge,
  ChallengeType,
  type Connection,
  ConnectionStatus,
  type CreateConnectionRequest,
  type Credential,
  type Institution,
  Institutions,
  type ProviderApiClient,
  type UpdateConnectionRequest,
  VcType
} from '@/../../shared/contract'
import * as logger from '../infra/logger'
import FinicityClient from '../serviceClients/finicityClient'
import { StorageClient } from '../serviceClients/storageClient'

const { v4: uuidv4 } = require('uuid')

export class FinicityApi implements ProviderApiClient {
  sandbox: boolean
  apiClient: any
  db: StorageClient
  token: string
  constructor (config: any, sandbox: boolean) {
    const { finicityProd, finicitySandbox, token, storageClient } = config
    this.token = token
    this.db = storageClient
    this.sandbox = sandbox
    this.apiClient = new FinicityClient(sandbox ? finicitySandbox : finicityProd)
  }

  async GetInstitutionById (id: string): Promise<Institution> {
    const ins = this.apiClient.getInstitution(id)
    return {
      id,
      name: ins?.name,
      logo_url: ins?.urlLogonApp,
      url: ins?.urlHomeApp,
      oauth: true,
      provider: this.apiClient.apiConfig.provider
    }
  }

  async ListInstitutionCredentials (id: string): Promise<Credential[]> {
    return await Promise.resolve([])
  }

  async ListConnectionCredentials (connectionId: string, userId: string): Promise<Credential[]> {
    return await Promise.resolve([])
  }

  async ListConnections (userId: string): Promise<Connection[]> {
    return await Promise.resolve([])
  }

  async CreateConnection (
    request: CreateConnectionRequest,
    user_id: string
  ): Promise<Connection | undefined> {
    const request_id = `${this.token};${uuidv4()}`
    const obj = {
      id: request_id,
      is_oauth: true,
      user_id,
      credentials: [] as any[],
      institution_code: request.institution_id,
      oauth_window_uri: await this.apiClient.generateConnectLiteUrl(request.institution_id, user_id, request_id),
      provider: this.apiClient.apiConfig.provider,
      status: ConnectionStatus.PENDING
    }
    await this.db.set(request_id, obj)
    return obj
  }

  async DeleteConnection (id: string): Promise<void> {
    return await this.db.set(id, null)
  }

  async UpdateConnection (
    request: UpdateConnectionRequest,
    user_id: string
  ): Promise<Connection> {
    return null
  }

  async GetConnectionById (connectionId: string, user_id: string): Promise<Connection> {
    return await this.getConnection(connectionId, user_id)
  }

  async GetConnectionStatus (connectionId: string, jobId: string, single_account_select?: boolean, user_id?: string): Promise<Connection> {
    return await this.getConnection(connectionId, user_id)
  }

  async AnswerChallenge (request: UpdateConnectionRequest, jobId: string): Promise<boolean> {
    return true
  }

  async ResolveUserId (user_id: string) {
    logger.debug('Resolving UserId: ' + user_id)
    const finicityUser = await this.apiClient.getCustomer(user_id)
    if (finicityUser) {
      logger.trace(`Found existing finicity customer ${finicityUser.id}`)
      return finicityUser.id
    }
    logger.trace(`Creating finicity user ${user_id}`)
    const ret = await this.apiClient.createCustomer(user_id)
    if (ret) {
      return ret.id
    }
    logger.trace(`Failed creating finicity user, using user_id: ${user_id}`)
    return user_id
  }

  static async HandleOauthResponse (request: any): Promise<Connection> {
    const { connection_id, eventType, reason, code } = request
    const db = new StorageClient(connection_id.split(';')[0])
    let institutionLoginId = false
    switch (eventType) {
      case 'added':
        institutionLoginId = request.payload.accounts?.[0]?.institutionLoginId
        break
      default:
        switch (reason) {
          case 'error':
            if (code === '201') {
              // refresh but unnecessary
              institutionLoginId = connection_id.split(';')[1]
            }
            break
        }
    }
    logger.info(`Received finicity webhook response ${connection_id}`)
    const connection = await db.get(connection_id)
    if (!connection) {
      return null
    }
    if (institutionLoginId) {
      connection.status = ConnectionStatus.CONNECTED
      connection.guid = connection_id
      connection.id = `${institutionLoginId}`
    }
    connection.request_id = connection_id
    connection.error = JSON.stringify(reason || '')
    await db.set(connection_id, connection)
    connection.storageClient = db
    return connection
  }

  async getConnection (id: string, user_id: string) {
    if (id.startsWith(this.token)) {
      return await this.db.get(id)
    } else {
      const request_id = `${this.token};${id}`
      const existing = await this.db.get(request_id)
      if (existing?.id) {
        return existing
      }
      const obj = {
        id: request_id,
        is_oauth: true,
        user_id,
        credentials: [] as any[],
        oauth_window_uri: await this.apiClient.generateConnectFixUrl(id, user_id, request_id),
        provider: this.apiClient.apiConfig.provider,
        status: ConnectionStatus.PENDING
      }
      await this.db.set(request_id, obj)
      return obj
    }
  }
}
