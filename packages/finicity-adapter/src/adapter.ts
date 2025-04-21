import type {
  AggregatorInstitution,
  Connection,
  CreateConnectionRequest,
  Credential,
  UpdateConnectionRequest,
  WidgetAdapter
} from "@repo/utils";
import {ConnectionStatus} from "@repo/utils";
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
    const resolved = await this.ResolveUserId(userId);
    await this.apiClient.deleteCustomer(resolved);
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ListInstitutionCredentials(id: string): Promise<Array<Credential>> {
    return Promise.resolve([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ListConnectionCredentials(connectionId: string, userId: string): Promise<Credential[]> {
    return Promise.resolve([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      userId: user_id,
      credentials: [] as any[],
      institution_code: request.institutionId,
      oauth_window_uri: await this.apiClient.generateConnectLiteUrl(request.institutionId, user_id, request_id),
      aggregator: this.aggregator,
      status: ConnectionStatus.PENDING,
      raw_status: 'PENDING'
    }
    await this.cacheClient.set(request_id, obj);
    return obj;
  }

  async DeleteConnection(
    id: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string
  ): Promise<void> {
    await this.cacheClient.set(id, null);
  }

  async UpdateConnection(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user_id: string,
  ): Promise<Connection> {
    return null;
  }

  GetConnectionById(connectionId: string, user_id: string): Promise<Connection> {
    return this.getConnection(connectionId, user_id);
  }

  GetConnectionStatus(
    connectionId: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jobId: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    single_account_select?: boolean, 
    user_id?: string
  ): Promise<Connection> {
    return this.getConnection(connectionId, user_id);
  }

  async AnswerChallenge(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: UpdateConnectionRequest, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jobId: string, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user_id: string
  ): Promise<boolean> {
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
    const ret = await this.apiClient.createCustomer(user_id)
    if(ret){
      return ret.id
    }
    this.logger.trace(`Failed creating finicity user, using user_id: ${user_id}`)
    return user_id;
  }

  async HandleOauthResponse(request: any): Promise<Connection> {
    const { connection_id, reason, code } = request?.query || {};
    const { eventType, payload } = request?.body || {};
    let institutionLoginId = false;
    let error = JSON.stringify(reason || '');
    let redirect_complete = false
    // eventType comes from webhook events, 
    // reason === complete can indicate process end from redirect, however, it lacks of the necessary institutionLoginId information so we don't take that event even if it comes before the webhook
    switch(eventType){
      case 'added':
        institutionLoginId = payload?.accounts?.[0]?.institutionLoginId;
        error = ''
        break;
      default:
        switch(reason){
          case 'error':{
            if(code === '201'){
              // refresh but unnecessary to refresh
              institutionLoginId = connection_id.split(';')[1];
            }
            break;
          }
          case 'complete': {
            if(code === '200'){
              error = ''
            }
            redirect_complete = true;
          }
        }
      
    }
    this.logger.info(`Received finicity ${eventType ? 'webhook': 'redirect'} response ${connection_id}`)
    const connection = await this.cacheClient.get(connection_id)
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
    connection.error = error
    await this.cacheClient.set(connection_id, connection)
    connection.storageClient = this.cacheClient;
  
    if(redirect_complete){
      //make sure redirect page displays correct successful message 
      //while don't save the status in case if oauth redirect is received before webhook
      connection.status = ConnectionStatus.CONNECTED
    }
    return connection;
  }

  async getConnection(id: string, user_id: string){
    if(id.startsWith(this.sessionId || user_id)){
      return await this.cacheClient.get(id);
    }else{
      const request_id = `${this.sessionId || user_id};${id}`;
      const existing = await this.cacheClient.get(request_id);
      if(existing?.id){
        return existing;
      }
      const obj = {
        id: request_id,
        is_oauth: true,
        userId: user_id,
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