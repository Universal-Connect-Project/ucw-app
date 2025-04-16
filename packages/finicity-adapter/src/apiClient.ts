import { default as axios, type AxiosInstance } from 'axios';
import type { LogClient, ApiCredentials } from "./models";

function makeFinicityAuthHeaders(apiConfig: any, tokenRes: any){
  return {
    'Finicity-App-Key': apiConfig.appKey,
    'Finicity-App-Token': tokenRes.token,
    // 'Content-Type': 'application/json', //msw error with this header? 
    'accept': 'application/json'
  }
}

export const BASE_PATH = 'https://api.finicity.com'

export default class FinicityClient{
  apiConfig: ApiCredentials;
  axios: AxiosInstance;
  logger: LogClient;
  envConfig: Record<string, string>;
  constructor(sandbox: boolean, apiConfig: ApiCredentials, logger: LogClient, envConfig: Record<string, string>){
    this.apiConfig = sandbox ? {
      ...apiConfig,
      basePath: "https://api.finicity.com",
      aggregator: "finicity_sandbox",
      available: true
    } : {
      ...apiConfig,
      basePath: "https://api.finicity.com",
      aggregator: "finicity",
      available: true
    };
    this.logger = logger;
    this.envConfig = envConfig;
  }

  getAuthToken(){
    return axios.post(this.apiConfig.basePath + '/aggregation/v2/partners/authentication', {
      'partnerId': this.apiConfig.partnerId,
      'partnerSecret': this.apiConfig.secret
    }, {
      headers: {
        'Finicity-App-Key': this.apiConfig.appKey,
        'Content-Type': 'application/json'
      }
    }).then(res => res.data).catch(err => {
      this.logger.error(`Error at finicityClient.getAuthToken`,  err)
    })
  }

  getInstitutions(){
    return this.get('institution/v2/institutions')
      .then(ret => ret.institutions)
  }

  async getInstitution(institutionId: string){
    return this.get(`institution/v2/institutions/${institutionId}`)
      .then(ret => ret.institution)
  }

  getCustomers(){
    return this.get('aggregation/v1/customers')
      .then(ret => ret.customers)
  }

  getCustomer(unique_name: string){
    return this.get(`aggregation/v1/customers?username=${unique_name}`)
      .then(ret => ret.customers?.[0])
  }

  getCustomerAccounts(customerId: string){
    return this.get(`aggregation/v1/customers/${customerId}/accounts`)
      .then(ret => ret.accounts)
  }

  getCustomerAccountsByInstitutionLoginId(customerId: string, institutionLoginId: string){
    return this.get(`aggregation/v1/customers/${customerId}/institutionLogins/${institutionLoginId}/accounts`)
      .then(res => res.accounts)
  }

  getAccountOwnerDetail(customerId: string, accountId: string){
    return this.get(`aggregation/v3/customers/${customerId}/accounts/${accountId}/owner`)
      .then(res => res.holders?.[0])
  }

  getAccountAchDetail(customerId: string, accountId: string){
    // {
    //   "routingNumber": "123456789",
    //   "realAccountNumber": 2345678901
    // }
    return this.get(`aggregation/v1/customers/${customerId}/accounts/${accountId}/details`)
  }

  getTransactions(customerId: string, accountId: string, fromDate: string, toDate: string){
    return this.get(`aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`, 
      {
        fromDate: Date.parse(fromDate) / 1000, 
        toDate: Date.parse(toDate) / 1000,
        limit: 20
      }
    )
    .then(res => res.transactions)
  }

  generateConnectLiteUrl(institutionId: string, customerId: string, request_id: string){
    const redir = `${this.envConfig.HostUrl}/oauth/${this.apiConfig.aggregator}/redirect_from?connection_id=${request_id}`
    return this.post('connect/v2/generate/lite',{
      language: 'en-US',
      partnerId: this.apiConfig.partnerId,
      customerId: customerId,
      institutionId,
      redirectUri: redir,
      webhook: `${this.envConfig.WebhookHostUrl}/webhook/${this.apiConfig.aggregator}/?connection_id=${request_id}`,
      webhookContentType: 'application/json',
      // 'singleUseUrl': true,
      // 'experience': 'default',
    }).then(ret => ret.link)
  }

  generateConnectFixUrl(institutionLoginId: string, customerId: string, request_id: string){
    return this.post('connect/v2/generate/fix',{
      language: 'en-US',
      partnerId: this.apiConfig.partnerId,
      customerId: customerId,
      institutionLoginId,
      redirectUri: `${this.envConfig.HostUrl}/oauth/${this.apiConfig.aggregator}/redirect_from?connection_id=${request_id}`,
      webhook: `${this.envConfig.WebhookHostUrl}/webhook/${this.apiConfig.aggregator}/?connection_id=${request_id}`,
      webhookContentType: 'application/json',
    }).then(ret => ret.link)
  }

  createCustomer(unique_name: string){
    return this.post(`aggregation/v2/customers/${this.apiConfig.aggregator === 'finicity' ? 'active' : 'testing'}`, {
      username: unique_name,
      firstName: 'John',
      lastName: 'Smith',
      // applicationId: '123456789',
      phone: '1-801-984-4200',
      email: 'myname@mycompany.com'
    })
  }

  deleteCustomer(customerId: string){
    return this.del(`aggregation/v2/customers/${customerId}`)
  }
  post(path: string, body: any){
    return this.request('post', path, null, body)
  }
  get(path: string, params: any = null){
    return this.request('get', path, params)
  }
  del(path: string, params: any = null){
    return this.request('delete', path, params)
  }
  async request(method: string, url: string, params: any, data: any = null){
    if(!this.axios){
      const token = await this.getAuthToken();
      const headers = makeFinicityAuthHeaders(this.apiConfig, token);
      this.axios = axios.create({
        baseURL: this.apiConfig.basePath,
        headers
      })
    }
    const ret = await this.axios.request({
        url: `${url}`,
        method,
        params,
        data
      })
      .then(res => res.data)
      .catch(err => {
        this.logger.error(`Error at finicityClient.${method} ${url}`,  err?.response?.data || err)
      })
    return ret;
  }
};

