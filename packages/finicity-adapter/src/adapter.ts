import type {
  Connection,
  CreateConnectionRequest,
  Credential,
  Institution, 
  KeyValuePair,
  UpdateConnectionRequest,
  WidgetAdapter
} from "./contract";
import {ChallengeType, ConnectionStatus} from "./contract";
import type { AdapterConfig, CacheClient, LogClient } from "./models";
import FinicityClient from './apiClient';
import { v4 as uuidv4 } from 'uuid';


export class FinicityAdapter implements WidgetAdapter {
  sessionId: string;
  aggregator: string;
  apiClient: FinicityClient;
  cacheClient: CacheClient;
  logger: LogClient;
  envConfig: Record<string, string>;

  constructor(args: AdapterConfig) {
    const {sandbox, sessionId, dependencies} = args;
    this.aggregator = sandbox ? "finicity_sandbox" : "finicity";
    this.sessionId = sessionId;
    this.cacheClient = dependencies?.cacheClient;
    this.logger = dependencies?.logClient;
    this.envConfig = dependencies?.envConfig;
    this.apiClient = sandbox
      ? new FinicityClient(sandbox, dependencies?.aggregatorCredentials.finicitySandbox, this.logger, this.envConfig)
      : new FinicityClient(sandbox, dependencies?.aggregatorCredentials.finicityProd, this.logger, this.envConfig);
  }

  async DeleteUser(userId: string) {
    let resolved = await this.ResolveUserId(userId);
    await this.apiClient.deleteCustomer(resolved);
  }

  async GetInstitutionById(id: string): Promise<Institution> {
    const ins = await this.apiClient.getInstitution(id);
    return {
      id, 
      name: ins?.name,
      logo_url: ins?.urlLogonApp,
      url: ins?.urlHomeApp,
      oauth: true,
      aggregator: this.aggregator
    }
  }

  async ListInstitutionCredentials(id: string): Promise<Array<Credential>> {
    return Promise.resolve([]);
  }

  async ListConnectionCredentials(connectionId: string, userId: string): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  ListConnections(userId: string): Promise<Connection[]> {
    return Promise.resolve([]);
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    user_id: string
  ): Promise<Connection | undefined> {
    const request_id = `${this.sessionId || user_id};${uuidv4()}`;
    const obj = {
      id: request_id,
      is_oauth: true,
      user_id,
      credentials: [] as any[],
      institution_code: request.institution_id,
      oauth_window_uri: await this.apiClient.generateConnectLiteUrl(request.institution_id, user_id, request_id),
      aggregator: this.aggregator,
      status: ConnectionStatus.PENDING,
      raw_status: 'PENDING'
    }
    await this.cacheClient.set(request_id, obj);
    return obj;
  }

  async DeleteConnection(id: string, userId: string): Promise<void> {
    await this.cacheClient.set(id, null);
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    user_id: string,
  ): Promise<Connection> {
    return null;
  }

  GetConnectionById(connectionId: string, user_id: string): Promise<Connection> {
    return this.getConnection(connectionId, user_id);
  }

  GetConnectionStatus(connectionId: string, jobId: string, single_account_select?: boolean, user_id?: string): Promise<Connection> {
    return this.getConnection(connectionId, user_id);
  }

  async AnswerChallenge(request: UpdateConnectionRequest, jobId: string, user_id: string): Promise<boolean> {
    return true;
  }

  async ResolveUserId(user_id: string, 
    failIfNotFound: boolean = false){
    this.logger.debug('Resolving UserId: ' + user_id);
    const finicityUser = await this.apiClient.getCustomer(user_id);
    if(finicityUser){
      this.logger.trace(`Found existing finicity customer ${finicityUser.id}`)
      return finicityUser.id
    }else if (failIfNotFound) {
      throw new Error("User not resolved successfully");
    }

    this.logger.trace(`Creating finicity user ${user_id}`)
    let ret = await this.apiClient.createCustomer(user_id)
    if(ret){
      return ret.id
    }
    this.logger.trace(`Failed creating finicity user, using user_id: ${user_id}`)
    return user_id;
  }

  async HandleOauthResponse(request: any): Promise<Connection> {
    const {connection_id, eventType, reason, code} = request;
    let institutionLoginId = false;
    switch(eventType){
      case 'added':
        institutionLoginId = request.payload.accounts?.[0]?.institutionLoginId;
        break;
      default:
        switch(reason){
          case 'error':
            if(code === '201'){
              // refresh but unnecessary 
              institutionLoginId = connection_id.split(';')[1];
            }
            break;
        }
      
    }
    this.logger.info(`Received finicity webhook response ${connection_id}`)
    let connection = await this.cacheClient.get(connection_id)
    if(!connection){
      return null;
    }
    if(institutionLoginId){
      connection.status = ConnectionStatus.CONNECTED
      connection.raw_status = 'CONNECTED'
      connection.guid = connection_id
      connection.id = `${institutionLoginId}`
    }
    connection.request_id = connection_id
    connection.error = JSON.stringify(reason || '')
    await this.cacheClient.set(connection_id, connection)
    connection.storageClient = this.cacheClient;
    return connection;
  }

  async getConnection(id: string, user_id: string){
    if(id.startsWith(this.sessionId || user_id)){
      return await this.cacheClient.get(id);
    }else{
      let request_id = `${this.sessionId || user_id};${id}`;
      let existing = await this.cacheClient.get(request_id);
      if(existing?.id){
        return existing;
      }
      const obj = {
        id: request_id,
        is_oauth: true,
        user_id,
        credentials: [] as any[],
        oauth_window_uri: await this.apiClient.generateConnectFixUrl(id, user_id, request_id),
        aggregator: this.aggregator,
        status: ConnectionStatus.PENDING,
        raw_status: 'PENDING'
      }
      await this.cacheClient.set(request_id, obj);
      return obj;
    }
  }
}